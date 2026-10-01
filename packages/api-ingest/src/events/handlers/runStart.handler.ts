import {
	isRunStatusTerminal,
	RunStatus,
	RunStatusSchema,
	type RunStartEvent,
} from '@jc68124/test-results-dashboard-core';
import type { AppCtx } from '../../types';
import { mapRunAttributes, mapRunMetadata } from './runMetadata';

export async function handleRunStart<TD1Binding extends string>(
	ctx: AppCtx<TD1Binding>,
	event: RunStartEvent
): Promise<void> {
	const { db } = ctx;

	const project = await db.project.findUnique({
		where: {
			publicId: event.payload.projectId,
		},
	});

	if (!project) {
		throw new Error(`Project with publicId "${event.payload.projectId}" not found.`);
	}

	const run = await db.run.findUnique({
		where: {
			publicId: event.payload.id,
		},
		select: {
			id: true,
			projectId: true,
			status: true,
		},
	});

	if (run && run.projectId !== project.id) {
		throw new Error(`Run with publicId "${event.payload.id}" belongs to a different project.`);
	}

	if (run && isRunStatusTerminal(RunStatusSchema.parse(run.status))) {
		return;
	}

	const attributes = event.payload.attributes;
	const data = {
		projectId: project.id,
		...mapRunMetadata(event.payload),
		framework: event.payload.runner,
		frameworkVersion: event.payload.runnerVersion ?? 'unknown',
		browser: event.payload.browserName ?? 'unknown',
		browserVersion: event.payload.browserVersion ?? 'unknown',
		os: formatOs(event.payload.osName, event.payload.osVersion),
		status: RunStatus.Running,
		startedAt: parseOptionalDate(event.payload.startedAt) ?? new Date(),
		endedAt: null,
		lastActivityAt: new Date(),
	};

	if (!run) {
		await db.run.create({
			data: {
				...data,
				publicId: event.payload.id,
				attributes: attributes?.length
					? { create: mapRunAttributes(attributes) }
					: undefined,
			},
		});

		return;
	}

	await db.run.update({
		where: {
			id: run.id,
			status: {
				in: [RunStatus.Running, RunStatus.TimedOut],
			},
		},
		data: {
			...data,
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
