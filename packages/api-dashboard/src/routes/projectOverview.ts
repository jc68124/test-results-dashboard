import type {
	ApiSuccess,
	ProjectOverview,
	ProjectOverviewTrendPoint,
	RunStats,
} from '@jc68124/test-results-dashboard-api-types';
import { GetProjectOverviewSchema, RunStatusSchema } from '@jc68124/test-results-dashboard-api-types';
import { Hono } from 'hono';
import { NotFoundError } from '../services/errors';
import type { HonoEnv } from '../types';

const RECENT_RUNS_LIMIT = 20;

const EMPTY_RUN_STATS: RunStats = {
	specs: 0,
	tests: 0,
	passed: 0,
	failed: 0,
	pending: 0,
	skipped: 0,
	duration: 0,
};

export function createOverviewRoutes<TD1Binding extends string>() {
	const app = new Hono<HonoEnv<TD1Binding>>();

	app.get('/projects/:publicId/overview', async (c) => {
		const ctx = c.get('ctx');
		const parsedParams = GetProjectOverviewSchema.safeParse({
			publicId: c.req.param('publicId'),
			days: c.req.query('days'),
		});

		if (!parsedParams.success) {
			throw parsedParams.error;
		}

		const project = await ctx.db.project.findUnique({
			where: {
				publicId: parsedParams.data.publicId,
			},
			select: {
				id: true,
			},
		});

		if (!project) {
			throw new NotFoundError(`Project with publicId "${parsedParams.data.publicId}" not found.`);
		}

		const periodEnd = new Date();
		const periodStart = startOfUtcPeriod(periodEnd, parsedParams.data.days);

		const [runs, recentRuns, latestRun, groupedSpecStats] = await Promise.all([
			ctx.db.run.findMany({
				where: {
					projectId: project.id,
					startedAt: {
						gte: periodStart,
						lte: periodEnd,
					},
				},
				select: {
					id: true,
					status: true,
					startedAt: true,
					endedAt: true,
				},
			}),
			ctx.db.run.findMany({
				where: {
					projectId: project.id,
					startedAt: {
						gte: periodStart,
						lte: periodEnd,
					},
				},
				orderBy: {
					startedAt: 'desc',
				},
				include: {
					attributes: {
						orderBy: {
							position: 'asc',
						},
					},
				},
				take: RECENT_RUNS_LIMIT,
			}),
			ctx.db.run.findFirst({
				where: {
					projectId: project.id,
				},
				orderBy: {
					startedAt: 'desc',
				},
				include: {
					attributes: {
						orderBy: {
							position: 'asc',
						},
					},
				},
			}),
			ctx.db.spec.groupBy({
				by: ['runId'],
				where: {
					run: {
						projectId: project.id,
						startedAt: {
							gte: periodStart,
							lte: periodEnd,
						},
					},
				},
				_sum: {
					tests: true,
					passed: true,
					failed: true,
					pending: true,
					skipped: true,
					duration: true,
				},
				_count: {
					_all: true,
				},
			}),
		]);

		const statsByRunId = new Map<number, RunStats>(
			groupedSpecStats.map((stats) => [
				stats.runId,
				{
					specs: stats._count._all,
					tests: stats._sum.tests ?? 0,
					passed: stats._sum.passed ?? 0,
					failed: stats._sum.failed ?? 0,
					pending: stats._sum.pending ?? 0,
					skipped: stats._sum.skipped ?? 0,
					duration: stats._sum.duration ?? 0,
				},
			])
		);

		if (latestRun && !statsByRunId.has(latestRun.id)) {
			const latestSpecStats = await ctx.db.spec.aggregate({
				where: {
					runId: latestRun.id,
				},
				_sum: {
					tests: true,
					passed: true,
					failed: true,
					pending: true,
					skipped: true,
					duration: true,
				},
				_count: {
					_all: true,
				},
			});

			statsByRunId.set(latestRun.id, {
				specs: latestSpecStats._count._all,
				tests: latestSpecStats._sum.tests ?? 0,
				passed: latestSpecStats._sum.passed ?? 0,
				failed: latestSpecStats._sum.failed ?? 0,
				pending: latestSpecStats._sum.pending ?? 0,
				skipped: latestSpecStats._sum.skipped ?? 0,
				duration: latestSpecStats._sum.duration ?? 0,
			});
		}

		const dailyStats = createDailyStats(periodStart, parsedParams.data.days);
		const completedDurations: number[] = [];
		let completedRuns = 0;
		let successfulRuns = 0;
		let completedPassed = 0;
		let completedFailed = 0;

		const summaryTotals = {
			tests: 0,
			passed: 0,
			failed: 0,
			pending: 0,
			skipped: 0,
		};

		for (const run of runs) {
			const stats = statsByRunId.get(run.id) ?? EMPTY_RUN_STATS;
			const day = dailyStats.get(toDateKey(run.startedAt));

			addStats(summaryTotals, stats);

			if (day) {
				day.point.runs += 1;
				addStats(day.point, stats);
			}

			if (!isCompletedRun(run.status)) {
				continue;
			}

			completedRuns += 1;
			completedPassed += stats.passed;
			completedFailed += stats.failed;

			if (day) {
				day.point.completedRuns += 1;
			}

			if (isSuccessfulRun(run.status, stats)) {
				successfulRuns += 1;

				if (day) {
					day.point.successfulRuns += 1;
				}
			} else if (day) {
				day.point.unsuccessfulRuns += 1;
			}

			const duration = getRunDuration(run.startedAt, run.endedAt);

			if (duration !== null) {
				completedDurations.push(duration);
				day?.durations.push(duration);
			}
		}

		const passRateTotal = completedPassed + completedFailed;
		const trend = Array.from(dailyStats.values(), ({ point, durations }) => ({
			...point,
			medianDuration: median(durations),
		}));

		const overview: ProjectOverview = {
			period: {
				days: parsedParams.data.days,
				from: periodStart,
				to: periodEnd,
			},
			summary: {
				runs: runs.length,
				completedRuns,
				successfulRuns,
				...summaryTotals,
				testPassRate: passRateTotal === 0 ? null : (completedPassed / passRateTotal) * 100,
				medianDuration: median(completedDurations),
			},
			latestRun: latestRun ? withStats(latestRun, statsByRunId) : null,
			recentRuns: recentRuns.map((run) => withStats(run, statsByRunId)),
			trend,
		};

		return c.json<ApiSuccess<ProjectOverview>>({
			success: true,
			data: overview,
		});
	});

	return app;
}

function startOfUtcPeriod(end: Date, days: number): Date {
	return new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - days + 1));
}

function createDailyStats(start: Date, days: number) {
	const dailyStats = new Map<
		string,
		{
			point: ProjectOverviewTrendPoint;
			durations: number[];
		}
	>();

	for (let index = 0; index < days; index += 1) {
		const date = new Date(start);
		date.setUTCDate(start.getUTCDate() + index);
		const dateKey = toDateKey(date);

		dailyStats.set(dateKey, {
			point: {
				date: dateKey,
				runs: 0,
				completedRuns: 0,
				successfulRuns: 0,
				unsuccessfulRuns: 0,
				tests: 0,
				passed: 0,
				failed: 0,
				pending: 0,
				skipped: 0,
				medianDuration: null,
			},
			durations: [],
		});
	}

	return dailyStats;
}

function addStats(
	target: Pick<ProjectOverviewTrendPoint, 'tests' | 'passed' | 'failed' | 'pending' | 'skipped'>,
	stats: Pick<RunStats, 'tests' | 'passed' | 'failed' | 'pending' | 'skipped'>
) {
	target.tests += stats.tests;
	target.passed += stats.passed;
	target.failed += stats.failed;
	target.pending += stats.pending;
	target.skipped += stats.skipped;
}

function withStats<T extends { id: number; status: string }>(run: T, statsByRunId: Map<number, RunStats>) {
	return {
		...run,
		status: RunStatusSchema.parse(run.status),
		stats: statsByRunId.get(run.id) ?? EMPTY_RUN_STATS,
	};
}

function isCompletedRun(status: string): boolean {
	return normalizeStatus(status) !== 'running';
}

function isSuccessfulRun(status: string, stats: RunStats): boolean {
	const normalizedStatus = normalizeStatus(status);

	return (normalizedStatus === 'finished' || normalizedStatus === 'passed') && stats.tests > 0 && stats.failed === 0;
}

function normalizeStatus(status: string): string {
	return status.toLowerCase().replaceAll('-', '').replaceAll('_', '').replaceAll(' ', '');
}

function getRunDuration(startedAt: Date, endedAt: Date | null): number | null {
	if (!endedAt) {
		return null;
	}

	return Math.max(0, endedAt.getTime() - startedAt.getTime());
}

function median(values: number[]): number | null {
	if (values.length === 0) {
		return null;
	}

	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);

	return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function toDateKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}
