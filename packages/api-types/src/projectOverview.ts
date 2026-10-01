import { z } from 'zod';
import { RunWithStatsSchema } from './runs.js';

export const OverviewPeriodDaysSchema = z.coerce.number().pipe(z.union([z.literal(7), z.literal(14), z.literal(30), z.literal(60), z.literal(90)]));

export type OverviewPeriodDays = z.infer<typeof OverviewPeriodDaysSchema>;

export const GetProjectOverviewSchema = z.object({
	publicId: z.uuid(),
	days: OverviewPeriodDaysSchema.optional().default(7),
});

export type GetProjectOverview = z.infer<typeof GetProjectOverviewSchema>;

export const ProjectOverviewSummarySchema = z.object({
	runs: z.number().int().nonnegative(),
	completedRuns: z.number().int().nonnegative(),
	successfulRuns: z.number().int().nonnegative(),
	tests: z.number().int().nonnegative(),
	passed: z.number().int().nonnegative(),
	failed: z.number().int().nonnegative(),
	pending: z.number().int().nonnegative(),
	skipped: z.number().int().nonnegative(),
	testPassRate: z.number().min(0).max(100).nullable(),
	medianDuration: z.number().nonnegative().nullable(),
});

export type ProjectOverviewSummary = z.infer<typeof ProjectOverviewSummarySchema>;

export const ProjectOverviewTrendPointSchema = z.object({
	date: z.string(),
	runs: z.number().int().nonnegative(),
	completedRuns: z.number().int().nonnegative(),
	successfulRuns: z.number().int().nonnegative(),
	unsuccessfulRuns: z.number().int().nonnegative(),
	tests: z.number().int().nonnegative(),
	passed: z.number().int().nonnegative(),
	failed: z.number().int().nonnegative(),
	pending: z.number().int().nonnegative(),
	skipped: z.number().int().nonnegative(),
	medianDuration: z.number().nonnegative().nullable(),
});

export type ProjectOverviewTrendPoint = z.infer<typeof ProjectOverviewTrendPointSchema>;

export const ProjectOverviewSchema = z.object({
	period: z.object({
		days: OverviewPeriodDaysSchema,
		from: z.coerce.date(),
		to: z.coerce.date(),
	}),
	summary: ProjectOverviewSummarySchema,
	latestRun: RunWithStatsSchema.nullable(),
	recentRuns: z.array(RunWithStatsSchema),
	trend: z.array(ProjectOverviewTrendPointSchema),
});

export type ProjectOverview = z.infer<typeof ProjectOverviewSchema>;