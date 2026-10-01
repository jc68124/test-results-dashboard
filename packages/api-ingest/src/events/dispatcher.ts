import type { DashboardEvent } from '@jc68124/test-results-dashboard-core';
import { handleRunStart } from './handlers/runStart.handler';
import { handleSpecFinish } from './handlers/specFinish.handler';
import { handleRunFinish } from './handlers/runFinish.handler';
import { AppCtx } from '../types';

export async function dispatchEvent<TD1Binding extends string>(
	ctx: AppCtx<TD1Binding>,
	event: DashboardEvent,
): Promise<void> {
	switch (event.type) {
		case 'run:start':
			return handleRunStart<TD1Binding>(ctx, event);

		case 'spec:finish':
			return handleSpecFinish<TD1Binding>(ctx, event);

		case 'run:finish':
			return handleRunFinish<TD1Binding>(ctx, event);

		default:
			return assertNever(event);
	}
}

function assertNever(value: never): never {
	throw new Error(`Unhandled event: ${JSON.stringify(value)}`);
}