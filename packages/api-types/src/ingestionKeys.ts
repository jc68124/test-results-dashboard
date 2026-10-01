import { z } from 'zod';

export const IngestKeySchema = z.object({
    id: z.number(),
    publicId: z.uuid(),
    projectId: z.number(),
    name: z.string(),
    prefix: z.string(),
    keyHash: z.string(),
    lastUsedAt: z.coerce.date().nullable(),
    expiresAt: z.coerce.date().nullable(),
    revokedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});

export type IngestKey = z.infer<typeof IngestKeySchema>;

export const PublicIngestKeySchema = z.object({
    publicId: z.uuid(),
    name: z.string(),
    prefix: z.string(),
    lastUsedAt: z.coerce.date().nullable(),
    expiresAt: z.coerce.date().nullable(),
    revokedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});

export type PublicIngestKey = z.infer<typeof PublicIngestKeySchema>;

export const GetProjectIngestionKeysSchema = z.object({
    publicId: z.uuid(),
});

export type GetProjectIngestionKeys = z.infer<typeof GetProjectIngestionKeysSchema>;

export const CreateIngestionKeySchema = z.object({
    name: z.string().min(1).max(255),
    expiresAt: z.coerce.date().nullable(),
});

export type CreateIngestionKey = z.infer<typeof CreateIngestionKeySchema>;

export const IngestionKeyCreatedResponseSchema = PublicIngestKeySchema.extend({
    apiKey: z.string(),
});

export type IngestionKeyCreatedResponse = z.infer<typeof IngestionKeyCreatedResponseSchema>;

export const ModifyIngestionKeySchema = z.object({
    publicId: z.uuid(),
    keyPublicId: z.uuid(),
});

export type ModifyIngestionKey = z.infer<typeof ModifyIngestionKeySchema>;