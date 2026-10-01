import { RunStatusSchema } from '@jc68124/test-results-dashboard-core';
import { z } from 'zod';
import type { ApiSuccess, PaginatedApiMeta } from './response.js';

export { canCancelRun, RunStatus, RunStatusSchema } from '@jc68124/test-results-dashboard-core';

export const RunAttributeKeySchema = z.string().trim().min(1).max(50);

export const RunResultFilter = {
	All: 'all',
	Failed: 'failed',
	Passed: 'passed',
	Running: 'running',
	Pending: 'pending',
	Skipped: 'skipped',
	TimedOut: 'timedOut',
	Interrupted: 'interrupted',
	Cancelled: 'cancelled',
	NoResults: 'noResults',
} as const;

export type RunResultFilter = (typeof RunResultFilter)[keyof typeof RunResultFilter];

export const RunResultFilterSchema = z.enum(RunResultFilter);

export const RunAttributeSchema = z.object({
	key: RunAttributeKeySchema,
	value: z.string(),
	showOnRunList: z.boolean(),
});

export type RunAttribute = z.infer<typeof RunAttributeSchema>;

export const AvailableRunAttributeSchema = z.object({
	key: RunAttributeKeySchema,
	values: z.array(z.string()),
});

export type AvailableRunAttribute = z.infer<typeof AvailableRunAttributeSchema>;

export const RunSchema = z.object({
	id: z.number(),
	publicId: z.string(),
	projectId: z.number(),
	name: z.string().nullable(),
	framework: z.string(),
	frameworkVersion: z.string(),
	browser: z.string(),
	browserVersion: z.string(),
	os: z.string(),
	branch: z.string().nullable(),
	commitSha: z.string().nullable(),
	commitMessage: z.string().nullable(),
	machineId: z.string().nullable(),
	shardId: z.string().nullable(),
	group: z.string().nullable(),
	parallel: z.boolean().nullable(),
	attributes: z.array(RunAttributeSchema),

	status: RunStatusSchema,
	startedAt: z.coerce.date(),
	endedAt: z.coerce.date().nullable(),

	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type Run = z.infer<typeof RunSchema>;

export const GetProjectRunsSchema = z
	.object({
		publicId: z.uuid(),
		page: z.coerce.number().int().min(1).optional().default(1),
		pageSize: z.coerce.number().int().min(1).max(25).optional().default(10),
		attributeKey: RunAttributeKeySchema.optional(),
		attributeValue: z.string().trim().min(1).max(255).optional(),
		result: RunResultFilterSchema.optional().default(RunResultFilter.All),
	})
	.refine((params) => !params.attributeValue || params.attributeKey, {
		message: 'attributeKey is required when attributeValue is provided.',
		path: ['attributeKey'],
	});

export type GetProjectRuns = z.infer<typeof GetProjectRunsSchema>;

export const GetProjectRunSchema = z.object({
	projectPublicId: z.uuid(),
	runPublicId: z.uuid(),
});

export type GetProjectRun = z.infer<typeof GetProjectRunSchema>;

export const RenameProjectRunSchema = z.object({
	name: z.string().trim().min(1).max(120),
});

export type RenameProjectRun = z.infer<typeof RenameProjectRunSchema>;

export const RunStatsSchema = z.object({
	specs: z.number().nonnegative(),
	tests: z.number().nonnegative(),
	passed: z.number().nonnegative(),
	failed: z.number().nonnegative(),
	pending: z.number().nonnegative(),
	skipped: z.number().nonnegative(),
	duration: z.number().nonnegative(),
});

export type RunStats = z.infer<typeof RunStatsSchema>;

export const RunWithStatsSchema = RunSchema.extend({
	stats: RunStatsSchema,
});

export type RunWithStats = z.infer<typeof RunWithStatsSchema>;

export type ProjectRunsMeta = PaginatedApiMeta & {
	availableAttributes: AvailableRunAttribute[];
};

export type ProjectRunsApiSuccess = ApiSuccess<RunWithStats[], ProjectRunsMeta>;
