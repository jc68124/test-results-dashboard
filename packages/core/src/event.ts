import { z } from 'zod';
import { RunInfoSchema, SpecInfoSchema, TestInfoSchema } from './run.js';

export const RunStartEventSchema = z.object({
    type: z.literal('run:start'),
    payload: RunInfoSchema,
});

export type RunStartEvent = z.infer<typeof RunStartEventSchema>;

export const SpecFinishEventSchema = z.object({
    type: z.literal('spec:finish'),
    payload: z.object({
        runId: z.string(),
        projectId: z.string(),
        spec: SpecInfoSchema,
        tests: TestInfoSchema.array(),
    }),
});

export type SpecFinishEvent = z.infer<typeof SpecFinishEventSchema>;

export const RunFinishEventSchema = z.object({
    type: z.literal('run:finish'),
    payload: z.union([
        z.object({
            runId: z.string(),
            projectId: z.string(),
            run: RunInfoSchema,
            specs: SpecInfoSchema.array(),
        }),
        z.object({
            runId: z.string(),
            projectId: z.string(),
            failures: z.number(),
            message: z.string(),
        }),
    ]),
});

export type RunFinishEvent = z.infer<typeof RunFinishEventSchema>;

export const DashboardEventSchema = z.union([
    RunStartEventSchema,
    SpecFinishEventSchema,
    RunFinishEventSchema,
]);

export type DashboardEvent = z.infer<typeof DashboardEventSchema>;