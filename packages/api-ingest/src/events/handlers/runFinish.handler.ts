import {
	isRunStatusTerminal,
	RunStatus,
	RunStatusSchema,
	type RunFinishEvent,
} from '@jc68124/test-results-dashboard-core';
import type { AppCtx } from '../../types';
import { mapRunAttributes, mapRunMetadata } from './runMetadata';

export async function handleRunFinish<TD1Binding extends string>(
	ctx: AppCtx<TD1Binding>,
	event: RunFinishEvent
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
			name: true,
			status: true,
		},
	});

	if (!run) {
		throw new Error(`Run not found: ${event.payload.runId}`);
	}

	if (isRunStatusTerminal(RunStatusSchema.parse(run.status))) {
		return;
	}

	if ('message' in event.payload) {
		await db.run.update({
			where: {
				id: run.id,
				status: {
					in: [RunStatus.Running, RunStatus.TimedOut],
				},
			},
			data: {
				status: RunStatus.Failed,
				endedAt: new Date(),
				lastActivityAt: new Date(),
			},
		});

		return;
	}

	const attributes = event.payload.run.attributes;
	const metadata = mapRunMetadata(event.payload.run);

	await db.run.update({
		where: {
			id: run.id,
			status: {
				in: [RunStatus.Running, RunStatus.TimedOut],
			},
		},
		data: {
			status: RunStatus.Finished,
			...metadata,
			name: run.name ?? metadata.name,
			framework: event.payload.run.runner,
			frameworkVersion: event.payload.run.runnerVersion ?? 'unknown',
			browser: event.payload.run.browserName ?? 'unknown',
			browserVersion: event.payload.run.browserVersion ?? 'unknown',
			os: formatOs(event.payload.run.osName, event.payload.run.osVersion),
			startedAt: parseOptionalDate(event.payload.run.startedAt),
			endedAt: parseOptionalDate(event.payload.run.endedAt) ?? new Date(),
			lastActivityAt: new Date(),
			attributes:
				attributes === undefined
					? undefined
					: {
							deleteMany: {},
							create: mapRunAttributes(attributes),
						},
		},
	});
}

function formatOs(osName: string | undefined, osVersion: string | undefined): string {
	return [osName, osVersion].filter(Boolean).join(' ') || 'unknown';
}

function parseOptionalDate(value: string | undefined): Date | undefined {
	if (!value) {
		return undefined;
	}

	return new Date(value);
}
