import {
	ApiSuccess,
	canCancelRun,
	GetProjectRunSchema,
	GetProjectRunsSchema,
	RenameProjectRunSchema,
	RunResultFilter,
	RunStatus,
	RunStatusSchema,
	RunWithStats,
	type ProjectRunsApiSuccess,
} from '@jc68124/test-results-dashboard-api-types';
import { Hono } from 'hono';
import { ConflictError, NotFoundError, ValidationError } from '../services/errors';
import type { HonoEnv } from '../types';

export function createRunRoutes<TD1Binding extends string>() {
	const app = new Hono<HonoEnv<TD1Binding>>();

	app.get('/projects/:publicId/runs', async (c) => {
		const ctx = c.get('ctx');

		const publicId = c.req.param('publicId');
		const page = c.req.query('page');
		const pageSize = c.req.query('pageSize');
		const attributeKey = c.req.query('attributeKey');
		const attributeValue = c.req.query('attributeValue');
		const result = c.req.query('result');
		const parsedParams = GetProjectRunsSchema.safeParse({
			publicId,
			page,
			pageSize,
			attributeKey,
			attributeValue,
			result,
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

		const runWhere = {
			projectId: project.id,
			...getRunResultWhere(parsedParams.data.result),
			...(parsedParams.data.attributeKey
				? {
						attributes: {
							some: {
								key: parsedParams.data.attributeKey,
								...(parsedParams.data.attributeValue
									? { value: parsedParams.data.attributeValue }
									: {}),
							},
						},
					}
				: {}),
		};

		const [totalRuns, groupedAttributeKeys, groupedAttributeValues] = await Promise.all([
			ctx.db.run.count({
				where: runWhere,
			}),
			ctx.db.runAttribute.groupBy({
				by: ['key'],
				where: {
					run: {
						projectId: project.id,
					},
				},
				orderBy: {
					key: 'asc',
				},
			}),
			parsedParams.data.attributeKey
				? ctx.db.runAttribute.groupBy({
						by: ['value'],
						where: {
							key: parsedParams.data.attributeKey,
							run: {
								projectId: project.id,
							},
						},
						orderBy: {
							value: 'asc',
						},
						take: 100,
					})
				: Promise.resolve([]),
		]);

		const totalPages = Math.max(1, Math.ceil(totalRuns / parsedParams.data.pageSize));

		const calculatedPage = Math.min(parsedParams.data.page, totalPages);

		const runs = await ctx.db.run.findMany({
			where: runWhere,
			include: {
				attributes: {
					orderBy: {
						position: 'asc',
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
			skip: (calculatedPage - 1) * parsedParams.data.pageSize,
			take: parsedParams.data.pageSize,
		});

		const stats = await ctx.db.spec.groupBy({
			by: ['runId'],
			where: {
				runId: {
					in: runs.map((run) => run.id),
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
		});

		const statsByRunId = new Map(
			stats.map((stat) => [
				stat.runId,
				{
					specs: stat._count._all,
					tests: stat._sum.tests ?? 0,
					passed: stat._sum.passed ?? 0,
					failed: stat._sum.failed ?? 0,
					pending: stat._sum.pending ?? 0,
					skipped: stat._sum.skipped ?? 0,
					duration: stat._sum.duration ?? 0,
				},
			])
		);

		const results = runs.map((run) => ({
			...run,
			status: RunStatusSchema.parse(run.status),
			stats: statsByRunId.get(run.id) ?? {
				specs: 0,
				tests: 0,
				passed: 0,
				failed: 0,
				pending: 0,
				skipped: 0,
				duration: 0,
			},
		}));

		const availableAttributes = groupedAttributeKeys.map(({ key }) => ({
			key,
			values: key === parsedParams.data.attributeKey ? groupedAttributeValues.map(({ value }) => value) : [],
		}));

		return c.json<ProjectRunsApiSuccess>({
			success: true,
			data: results,
			meta: {
				pagination: {
					page: calculatedPage,
					pageSize: parsedParams.data.pageSize,
					total: totalRuns,
					totalPages,
				},
				availableAttributes,
			},
		});
	});

	app.get('/projects/:publicId/runs/:runId', async (c) => {
		const ctx = c.get('ctx');

		const projectPublicId = c.req.param('publicId');
		const runPublicId = c.req.param('runId');
		const parsedParams = GetProjectRunSchema.safeParse({
			projectPublicId,
			runPublicId,
		});

		if (!parsedParams.success) {
			throw parsedParams.error;
		}

		const project = await ctx.db.project.findUnique({
			where: {
				publicId: parsedParams.data.projectPublicId,
			},
			select: {
				id: true,
			},
		});

		if (!project) {
			throw new NotFoundError(`Project with publicId "${parsedParams.data.projectPublicId}" not found.`);
		}

		const run = await ctx.db.run.findFirst({
			where: {
				projectId: project.id,
				publicId: parsedParams.data.runPublicId,
			},
			include: {
				attributes: {
					orderBy: {
						position: 'asc',
					},
				},
			},
		});

		if (!run) {
			throw new NotFoundError(`Run with publicId "${parsedParams.data.runPublicId}" not found.`);
		}

		const stats = await ctx.db.spec.aggregate({
			where: {
				runId: run.id,
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

		return c.json<ApiSuccess<RunWithStats>>({
			success: true,
			data: {
				...run,
				status: RunStatusSchema.parse(run.status),
				stats: {
					specs: stats._count._all,
					tests: stats._sum.tests ?? 0,
					passed: stats._sum.passed ?? 0,
					failed: stats._sum.failed ?? 0,
					pending: stats._sum.pending ?? 0,
					skipped: stats._sum.skipped ?? 0,
					duration: stats._sum.duration ?? 0,
				},
			},
		});
	});

	app.patch('/projects/:publicId/runs/:runId', async (c) => {
		const ctx = c.get('ctx');
		const parsedParams = GetProjectRunSchema.safeParse({
			projectPublicId: c.req.param('publicId'),
			runPublicId: c.req.param('runId'),
		});

		if (!parsedParams.success) {
			throw parsedParams.error;
		}

		let body: unknown;

		try {
			body = await c.req.json();
		} catch (error) {
			throw new ValidationError('Invalid JSON body.', error);
		}

		const parsedBody = RenameProjectRunSchema.safeParse(body);

		if (!parsedBody.success) {
			throw parsedBody.error;
		}

		const run = await ctx.db.run.findFirst({
			where: {
				publicId: parsedParams.data.runPublicId,
				project: {
					publicId: parsedParams.data.projectPublicId,
				},
			},
			select: {
				id: true,
			},
		});

		if (!run) {
			throw new NotFoundError(`Run with publicId "${parsedParams.data.runPublicId}" not found.`);
		}

		await ctx.db.run.update({
			where: {
				id: run.id,
			},
			data: {
				name: parsedBody.data.name,
			},
		});

		return c.json<ApiSuccess<RunWithStats>>({
			success: true,
			data: await getRunWithStats(ctx, run.id),
		});
	});

	app.post('/projects/:publicId/runs/:runId/cancel', async (c) => {
		const ctx = c.get('ctx');
		const parsedParams = GetProjectRunSchema.safeParse({
			projectPublicId: c.req.param('publicId'),
			runPublicId: c.req.param('runId'),
		});

		if (!parsedParams.success) {
			throw parsedParams.error;
		}

		const run = await ctx.db.run.findFirst({
			where: {
				publicId: parsedParams.data.runPublicId,
				project: {
					publicId: parsedParams.data.projectPublicId,
				},
			},
			select: {
				id: true,
				status: true,
			},
		});

		if (!run) {
			throw new NotFoundError(`Run with publicId "${parsedParams.data.runPublicId}" not found.`);
		}

		const status = RunStatusSchema.parse(run.status);

		if (status === RunStatus.Cancelled) {
			return c.json<ApiSuccess<RunWithStats>>({
				success: true,
				data: await getRunWithStats(ctx, run.id),
			});
		}

		if (!canCancelRun(status)) {
			throw new ConflictError(`A run with status "${status}" cannot be cancelled.`);
		}

		const now = new Date();
		const result = await ctx.db.run.updateMany({
			where: {
				id: run.id,
				status: {
					in: [RunStatus.Running, RunStatus.TimedOut],
				},
			},
			data: {
				status: RunStatus.Cancelled,
				endedAt: now,
				lastActivityAt: now,
			},
		});

		if (result.count === 0) {
			throw new ConflictError('The run changed state before it could be cancelled. Refresh and try again.');
		}

		return c.json<ApiSuccess<RunWithStats>>({
			success: true,
			data: await getRunWithStats(ctx, run.id),
		});
	});

	app.delete('/projects/:publicId/runs/:runId', async (c) => {
		const ctx = c.get('ctx');
		const parsedParams = GetProjectRunSchema.safeParse({
			projectPublicId: c.req.param('publicId'),
			runPublicId: c.req.param('runId'),
		});

		if (!parsedParams.success) {
			throw parsedParams.error;
		}

		const run = await ctx.db.run.findFirst({
			where: {
				publicId: parsedParams.data.runPublicId,
				project: {
					publicId: parsedParams.data.projectPublicId,
				},
			},
			select: {
				id: true,
				status: true,
			},
		});

		if (!run) {
			throw new NotFoundError(`Run with publicId "${parsedParams.data.runPublicId}" not found.`);
		}

		const status = RunStatusSchema.parse(run.status);

		if (canCancelRun(status)) {
			throw new ConflictError('Cancel the run before deleting it.');
		}

		await ctx.db.run.delete({
			where: {
				id: run.id,
			},
		});

		return c.json<ApiSuccess<null>>({ success: true, data: null });
	});

	return app;
}

function getRunResultWhere(result: RunResultFilter) {
	switch (result) {
		case RunResultFilter.Failed:
			return {
				OR: [
					{ status: RunStatus.Failed },
					{ specs: { some: { failed: { gt: 0 } } } },
				],
			};
		case RunResultFilter.Passed:
			return {
				status: RunStatus.Finished,
				specs: {
					some: { tests: { gt: 0 } },
					none: { failed: { gt: 0 } },
				},
			};
		case RunResultFilter.Running:
			return { status: RunStatus.Running };
		case RunResultFilter.Pending:
			return { specs: { some: { pending: { gt: 0 } } } };
		case RunResultFilter.Skipped:
			return { specs: { some: { skipped: { gt: 0 } } } };
		case RunResultFilter.TimedOut:
			return { status: RunStatus.TimedOut };
		case RunResultFilter.Interrupted:
			return { status: RunStatus.Interrupted };
		case RunResultFilter.Cancelled:
			return { status: RunStatus.Cancelled };
		case RunResultFilter.NoResults:
			return {
				status: RunStatus.Finished,
				specs: { none: { tests: { gt: 0 } } },
			};
		case RunResultFilter.All:
			return {};
	}
}

async function getRunWithStats<TD1Binding extends string>(
	ctx: HonoEnv<TD1Binding>['Variables']['ctx'],
	runId: number,
): Promise<RunWithStats> {
	const [run, stats] = await Promise.all([
		ctx.db.run.findUnique({
			where: {
				id: runId,
			},
			include: {
				attributes: {
					orderBy: {
						position: 'asc',
					},
				},
			},
		}),
		ctx.db.spec.aggregate({
			where: {
				runId,
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

	if (!run) {
		throw new NotFoundError('Run not found.');
	}

	return {
		...run,
		status: RunStatusSchema.parse(run.status),
		stats: {
			specs: stats._count._all,
			tests: stats._sum.tests ?? 0,
			passed: stats._sum.passed ?? 0,
			failed: stats._sum.failed ?? 0,
			pending: stats._sum.pending ?? 0,
			skipped: stats._sum.skipped ?? 0,
			duration: stats._sum.duration ?? 0,
		},
	};
}
