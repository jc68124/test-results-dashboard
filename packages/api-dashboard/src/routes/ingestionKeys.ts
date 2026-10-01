import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import type { ApiSuccess, PublicIngestKey, IngestionKeyCreatedResponse } from '@jc68124/test-results-dashboard-api-types';
import { GetProjectIngestionKeysSchema, ModifyIngestionKeySchema, CreateIngestionKeySchema, IngestionKeyCreatedResponseSchema } from '@jc68124/test-results-dashboard-api-types';
import { AlreadyExistsError, NotFoundError, ValidationError } from '../services/errors';
import { generateApiKey, hashApiKey } from '../services/keys';

export function createIngestionKeyRoutes<
	TD1Binding extends string,
>() {
    const app = new Hono<HonoEnv<TD1Binding>>();

    app.get('/projects/:publicId/ingestion-keys', async(c) => {
        const ctx = c.get('ctx');

        const publicId = c.req.param('publicId');
        const parsedParams = GetProjectIngestionKeysSchema.safeParse({ publicId });

        if (!parsedParams.success) {
            throw parsedParams.error;
        }

        const project = await ctx.db.project.findUnique({
            where: {
                publicId: parsedParams.data.publicId,
            },
            select: {
                id: true,
            },
        });

        if (!project) {
            throw new NotFoundError(`Project with publicId "${parsedParams.data.publicId}" not found.`);
        }

        const ingestionKeys = await ctx.db.ingestKey.findMany({
            select: {
                publicId: true,
                name: true,
                prefix: true,
                lastUsedAt: true,
                expiresAt: true,
                revokedAt: true,
                createdAt: true,
                updatedAt: true,
            },
            where: {
                projectId: project.id,
            }
        });

        return c.json<ApiSuccess<PublicIngestKey[]>>({ success: true, data: ingestionKeys });
    });

    app.post('/projects/:publicId/ingestion-keys', async(c) => {
        const ctx = c.get('ctx');

        const publicId = c.req.param('publicId');
        const parsedParams = GetProjectIngestionKeysSchema.safeParse({ publicId });
        
        if (!parsedParams.success) {
            throw parsedParams.error;
        }

        let body: unknown;

        try {
            body = await c.req.json();
        } catch (error) {
            throw new ValidationError('Invalid JSON body.', error);
        }
        
        const parsedBody = CreateIngestionKeySchema.safeParse(body);

        if (!parsedBody.success) {
            throw parsedBody.error;
        }

        if (
            parsedBody.data.expiresAt &&
            parsedBody.data.expiresAt.getTime() <= Date.now()
        ) {
            throw new ValidationError(
                'The expiration date must be in the future.',
            );
        }

        const project = await ctx.db.project.findUnique({
            where: {
                publicId: parsedParams.data.publicId,
            },
        });

        if (!project) {
            throw new NotFoundError(`Project with publicId "${parsedParams.data.publicId}" not found.`);
        }

        const existingKey = await ctx.db.ingestKey.findFirst({
            where: {
                projectId: project.id,
                name: parsedBody.data.name,
            },
            select: { id: true },
        });
        if (existingKey) {
            throw new AlreadyExistsError(
                `An ingestion key with the name "${parsedBody.data.name}" already exists.`,
            );
        }

        const apiKey = generateApiKey();
        const apiKeyPrefix = apiKey.slice(0, 16);
        const apiKeyHash = await hashApiKey(apiKey);

        const ingestionKey = await ctx.db.ingestKey.create({
            data: {
                name: parsedBody.data.name,
                prefix: apiKeyPrefix,
                keyHash: apiKeyHash,
                expiresAt: parsedBody.data.expiresAt,
                projectId: project.id,
            },
        });

        const responseData = IngestionKeyCreatedResponseSchema.parse({
            ...ingestionKey,
            apiKey,
        });

        return c.json<ApiSuccess<IngestionKeyCreatedResponse>>({ success: true, data: responseData }, 201);
    });

    app.post('/projects/:publicId/ingestion-keys/:keyPublicId/revoke', async(c) => {
        const ctx = c.get('ctx');

        const publicId = c.req.param('publicId');
        const keyPublicId = c.req.param('keyPublicId');
        const parsedParams = ModifyIngestionKeySchema.safeParse({ publicId, keyPublicId });
        
        if (!parsedParams.success) {
            throw parsedParams.error;
        }

        const ingestionKey = await ctx.db.ingestKey.findFirst({
            where: {
                publicId: parsedParams.data.keyPublicId,
                project: {
                    publicId: parsedParams.data.publicId,
                }
            }
        });

        if (!ingestionKey) {
            throw new NotFoundError(`Ingestion key with publicId "${parsedParams.data.keyPublicId}" not found for project with publicId "${parsedParams.data.publicId}".`);
        }

        await ctx.db.ingestKey.update({
            where: {
                publicId: parsedParams.data.keyPublicId,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        return c.json<ApiSuccess<null>>({ success: true, data: null });
    });

    app.delete('/projects/:publicId/ingestion-keys/:keyPublicId', async(c) => {
        const ctx = c.get('ctx');

        const publicId = c.req.param('publicId');
        const keyPublicId = c.req.param('keyPublicId');
        const parsedParams = ModifyIngestionKeySchema.safeParse({ publicId, keyPublicId });
        
        if (!parsedParams.success) {
            throw parsedParams.error;
        }

        const ingestionKey = await ctx.db.ingestKey.findFirst({
            where: {
                publicId: parsedParams.data.keyPublicId,
                project: {
                    publicId: parsedParams.data.publicId,
                }
            }
        });

        if (!ingestionKey) {
            throw new NotFoundError(`Ingestion key with publicId "${parsedParams.data.keyPublicId}" not found for project with publicId "${parsedParams.data.publicId}".`);
        }

        await ctx.db.ingestKey.delete({
            where: {
                publicId: parsedParams.data.keyPublicId,
            },
        });

        return c.json<ApiSuccess<null>>({ success: true, data: null });
    });

    return app;
}

