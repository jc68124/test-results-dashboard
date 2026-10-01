import { z } from 'zod';

export const ArtifactSchema = z.object({
    name: z.string().nullable().optional(),
    path: z.string().optional(),
    type: z.string().optional(),
    contentType: z.string().optional(),
    size: z.number().optional(),
});

export type Artifact = z.infer<typeof ArtifactSchema>;