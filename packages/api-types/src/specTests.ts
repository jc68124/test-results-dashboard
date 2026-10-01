import { z } from 'zod';

export const SpecTestSchema = z.object({
    id: z.number().int().positive(),
    specId: z.number().int().positive(),
    status: z.string(),
    duration: z.number().int().nonnegative(),
    message: z.string().nullable(),
    trace: z.string().nullable(),
});

export type SpecTest = z.infer<typeof SpecTestSchema>;

export const SpecTestTitlePartSchema = z.object({
    id: z.number().int().positive(),
    specTestId: z.number().int().positive(),
    position: z.number().int().nonnegative(),
    value: z.string(),
});

export type SpecTestTitlePart = z.infer<typeof SpecTestTitlePartSchema>;

export const SpecTestAttemptSchema = z.object({
    id: z.number().int().positive(),
    specTestId: z.number().int().positive(),
    status: z.string(),
    message: z.string().nullable(),
    trace: z.string().nullable(),
});

export type SpecTestAttempt = z.infer<typeof SpecTestAttemptSchema>;

export const FullSpecTestSchema = SpecTestSchema.extend({
    specTestAttempts: z.array(SpecTestAttemptSchema),
    titleParts: z.array(SpecTestTitlePartSchema),
});

export type FullSpecTest = z.infer<typeof FullSpecTestSchema>;