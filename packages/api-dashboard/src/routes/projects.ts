import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import type { Project, ApiSuccess } from '@jc68124/test-results-dashboard-api-types';
import { CreateProjectSchema, GetProjectSchema, EditProjectSchema } from '@jc68124/test-results-dashboard-api-types';
import { AlreadyExistsError, NotFoundError, ValidationError } from '../services/errors';

export function createProjectRoutes<
	TD1Binding extends string,
>() {
    const app = new Hono<HonoEnv<TD1Binding>>();

    app.get('/projects', async(c) => {
        const ctx = c.get('ctx');

        const projects = await ctx.db.project.findMany();

        return c.json<ApiSuccess<Project[]>>({ success: true, data: projects });
    });

    app.get('/projects/:publicId', async(c) => {
        const ctx = c.get('ctx');

        const publicId = c.req.param('publicId');
        const parsedParams = GetProjectSchema.safeParse({ publicId });
        
        if (!parsedParams.success) {
            throw parsedParams.error;
        }

        const project = await ctx.db.project.findUnique({
            where: {
                publicId: parsedParams.data.publicId,
            },
        });

        if (!project) {
            throw new NotFoundError(`Project with publicId "${parsedParams.data.publicId}" not found.`);
        }

        return c.json<ApiSuccess<Project>>({ success: true, data: project });
    });

    app.post('/projects', async(c) => {
        const ctx = c.get('ctx');
        
        let body: unknown;

        try {
            body = await c.req.json();
        } catch (error) {
            throw new ValidationError('Invalid JSON body.', error);
        }
        
        const parsedBody = CreateProjectSchema.safeParse(body);

        if (!parsedBody.success) {
            throw parsedBody.error;
        }

        const existingProject = await ctx.db.project.findUnique({
            where: {
                name: parsedBody.data.name,
            },
        });

        if (existingProject) {
            throw new AlreadyExistsError(`A project with the name "${parsedBody.data.name}" already exists.`);
        }

        const project = await ctx.db.project.create({
            data: {
                name: parsedBody.data.name,
            },
        });

        return c.json<ApiSuccess<Project>>({ success: true, data: project }, 201);
    });

    app.patch('/projects/:publicId', async(c) => {
        const ctx = c.get('ctx');

        const publicId = c.req.param('publicId');
        const parsedParams = GetProjectSchema.safeParse({ publicId });
        
        if (!parsedParams.success) {
            throw parsedParams.error;
        }

        let body: unknown;

        try {
            body = await c.req.json();
        } catch (error) {
            throw new ValidationError('Invalid JSON body.', error);
        }

        const parsedBody = EditProjectSchema.safeParse(body);

        if (!parsedBody.success) {
            throw parsedBody.error;
        }

        const project = await ctx.db.project.findUnique({
            where: {
                publicId: parsedParams.data.publicId,
            },
        });

        if (!project) {
            throw new NotFoundError(`Project with publicId "${parsedParams.data.publicId}" not found.`);
        }

        if (parsedBody.data.name && parsedBody.data.name !== project.name) {
            const existingProject = await ctx.db.project.findUnique({
                where: {
                    name: parsedBody.data.name,
                },
            });

            if (existingProject) {
                throw new AlreadyExistsError(`A project with the name "${parsedBody.data.name}" already exists.`);
            }
        }

        const updatedProject = await ctx.db.project.update({
            where: {
                publicId: parsedParams.data.publicId,
            },
            data: {
                name: parsedBody.data.name ?? project.name,
                active: parsedBody.data.active ?? project.active,
            },
        });

        return c.json<ApiSuccess<Project>>({ success: true, data: updatedProject });
    });

    app.delete('/projects/:publicId', async(c) => {
        const ctx = c.get('ctx');

        const publicId = c.req.param('publicId');
        const parsedParams = GetProjectSchema.safeParse({ publicId });
        
        if (!parsedParams.success) {
            throw parsedParams.error;
        }

        const project = await ctx.db.project.findUnique({
            where: {
                publicId: parsedParams.data.publicId,
            },
        });

        if (!project) {
            throw new NotFoundError(`Project with publicId "${parsedParams.data.publicId}" not found.`);
        }

        await ctx.db.project.delete({
            where: {
                publicId: parsedParams.data.publicId,
            },
        });

        return c.json<ApiSuccess<null>>({ success: true, data: null });
    });

    return app;
}
