import { z } from 'zod';

export const ProjectSchema = z.object({
    id: z.number(),
    publicId: z.uuid(),
    name: z.string(),
    active: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const GetProjectSchema = z.object({
    publicId: z.uuid(),
});

export type GetProject = z.infer<typeof GetProjectSchema>;

export const CreateProjectSchema = z.object({
    name: z.string().min(1, { message: 'Project name is required' }),
});

export type CreateProject = z.infer<typeof CreateProjectSchema>;

export const EditProjectSchema = z.object({
    name: z.string().min(1, { message: 'Project name is required' }).optional(),
    active: z.boolean().optional(),
});

export type EditProject = z.infer<typeof EditProjectSchema>;
