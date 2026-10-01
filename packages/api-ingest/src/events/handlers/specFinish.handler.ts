import {
	isRunClosedToIngestion,
	RunStatus,
	RunStatusSchema,
	type SpecFinishEvent,
} from '@jc68124/test-results-dashboard-core';
import type { AppCtx } from '../../types';

export async function handleSpecFinish<TD1Binding extends string>(
	ctx: AppCtx<TD1Binding>,
	event: SpecFinishEvent,
): Promise<void> {
	const { db } = ctx;

	const run = await db.run.findUnique({
		where: {
			publicId: event.payload.runId,
			project: {
				publicId: event.payload.projectId,
			},
		},
		select: {
			id: true,
			status: true,
		},
	});

	if (!run) {
		throw new Error(`Run not found: ${event.payload.runId}`);
	}

	if (isRunClosedToIngestion(RunStatusSchema.parse(run.status))) {
		return;
	}

	const filename = getSpecFilename(event.payload.spec);

	const spec = await db.spec.upsert({
		where: {
			runId_filename: {
				runId: run.id,
				filename,
			},
		},
		create: {
			runId: run.id,
			filename,
			tests: event.payload.spec.tests,
			passed: event.payload.spec.passes,
			failed: event.payload.spec.failures,
			pending: event.payload.spec.pending,
			skipped: event.payload.spec.skipped,
			duration: event.payload.spec.duration ?? 0,
			startedAt: new Date(event.payload.spec.startedAt),
			endedAt: new Date(event.payload.spec.endedAt),
			status: getSpecStatus(event),
			message: getSpecMessage(event),
		},
		update: {
			tests: event.payload.spec.tests,
			passed: event.payload.spec.passes,
			failed: event.payload.spec.failures,
			pending: event.payload.spec.pending,
			skipped: event.payload.spec.skipped,
			duration: event.payload.spec.duration ?? 0,
			startedAt: new Date(event.payload.spec.startedAt),
			endedAt: new Date(event.payload.spec.endedAt),
			status: getSpecStatus(event),
			message: getSpecMessage(event),
		},
		select: {
			id: true,
		},
	});

	await db.specTest.deleteMany({
		where: {
			specId: spec.id,
		},
	});

	for (const test of event.payload.tests) {
		const specTest = await db.specTest.create({
			data: {
				specId: spec.id,
				titleParts: {
					createMany: {
						data: test.title.map((value, position) => ({
							position,
							value,
						})),
					},
				},
				status: test.status,
				duration: test.duration ?? 0,
				message: test.displayError,
			},
			select: {
				id: true,
			},
		});

		if (!test.attempts?.length) {
			continue;
		}

		await db.specTestAttempt.createMany({
			data: test.attempts.map((attempt) => ({
				specTestId: specTest.id,
				status: attempt.state ?? test.status,
				message: attempt.state === 'failed'
					? test.displayError
					: undefined,
			})),
		});
	}

	await db.run.updateMany({
		where: {
			id: run.id,
			status: {
				in: [RunStatus.Running, RunStatus.TimedOut],
			},
		},
		data: {
			status: RunStatus.Running,
			endedAt: null,
			lastActivityAt: new Date(),
		},
	});
}

function getSpecFilename(spec: SpecFinishEvent['payload']['spec']): string {
	return spec.relative ?? spec.name;
}

function getSpecStatus(event: SpecFinishEvent): string {
	if (event.payload.spec.failures > 0) {
		return 'failed';
	}

	if (event.payload.spec.pending > 0 || event.payload.spec.skipped > 0) {
		return 'partial';
	}

	return 'passed';
}

function getSpecMessage(event: SpecFinishEvent): string | undefined {
	const firstFailedTest = event.payload.tests.find((test) => test.displayError);

	return firstFailedTest?.displayError;
}
