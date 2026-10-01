import { z } from 'zod';
import { DashboardEventSchema } from './event.js';
import { RunInfoSchema, SpecInfoSchema, TestInfoSchema, type RunInfo, type SpecInfo, type TestInfo } from './run.js';

export const IngestEventRequestSchema = z.object({
    event: DashboardEventSchema,
});

export type IngestEventRequest = z.infer<typeof IngestEventRequestSchema>;

export const IngestEventSuccessResponseSchema = z.object({
    ok: z.literal(true),
});

export type IngestEventSuccessResponse = z.infer<typeof IngestEventSuccessResponseSchema>;

export const IngestEventErrorResponseSchema = z.object({
    ok: z.literal(false),
    error: z.string(),
    details: z.any().optional(),
});

export type IngestEventErrorResponse = z.infer<typeof IngestEventErrorResponseSchema>;

export const IngestEventResponseSchema = z.union([IngestEventSuccessResponseSchema, IngestEventErrorResponseSchema]);

export type IngestEventResponse = z.infer<typeof IngestEventResponseSchema>;

export const GetRunResponseSchema = z.object({
    run: RunInfoSchema,
    specs: z.array(
        z.object({
            spec: SpecInfoSchema,
            tests: z.array(TestInfoSchema),
        }),
    ),
});

export type GetRunResponse = z.infer<typeof GetRunResponseSchema>;

export const ListRunsResponseSchema = z.object({
    runs: z.array(RunInfoSchema),
});

export type ListRunsResponse = z.infer<typeof ListRunsResponseSchema>;