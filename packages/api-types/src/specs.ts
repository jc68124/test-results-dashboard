import { z } from 'zod';
import { FullSpecTestSchema } from './specTests.js';

export const SpecResultFilter = {
	All: 'all',
	Failed: 'failed',
	Passed: 'passed',
	Pending: 'pending',
	Skipped: 'skipped',
} as const;

export type SpecResultFilter = (typeof SpecResultFilter)[keyof typeof SpecResultFilter];

export const SpecResultFilterSchema = z.enum(SpecResultFilter);

export const SpecSchema = z.object({
	id: z.number().int().positive(),
	runId: z.number().int().positive(),
	filename: z.string(),
	tests: z.number().int().nonnegative(),
	passed: z.number().int().nonnegative(),
	failed: z.number().int().nonnegative(),
	pending: z.number().int().nonnegative(),
	skipped: z.number().int().nonnegative(),
	duration: z.number().int().nonnegative(),
	startedAt: z.coerce.date(),
	endedAt: z.coerce.date(),
	status: z.string().default('running'),
	message: z.string().nullable(),
});

export type Spec = z.infer<typeof SpecSchema>;

export const GetProjectRunsSpecsSchema = z.object({
	projectPublicId: z.uuid(),
	runPublicId: z.uuid(),
	page: z.coerce.number().int().min(1).optional().default(1),
	pageSize: z.coerce.number().int().min(1).max(25).optional().default(25),
	result: SpecResultFilterSchema.optional().default(SpecResultFilter.All),
});

export type GetProjectRunsSpecs = z.infer<typeof GetProjectRunsSpecsSchema>;

export const FullSpecSchema = SpecSchema.extend({
	specTests: z.array(FullSpecTestSchema),
});

export type FullSpec = z.infer<typeof FullSpecSchema>;
