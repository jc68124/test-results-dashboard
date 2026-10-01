import { z } from 'zod';

export const RunStatus = {
	Running: 'running',
	Finished: 'finished',
	Failed: 'failed',
	TimedOut: 'timedOut',
	Interrupted: 'interrupted',
	Cancelled: 'cancelled',
} as const;

export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

export const RunStatusSchema = z.enum(RunStatus);

export function isRunStatusTerminal(status: RunStatus): boolean {
	return status !== RunStatus.Running && status !== RunStatus.TimedOut;
}

export function canCancelRun(status: RunStatus): boolean {
	return status === RunStatus.Running || status === RunStatus.TimedOut;
}

export function isRunClosedToIngestion(
	status: RunStatus,
): boolean {
	return (
		status === RunStatus.Cancelled ||
		status === RunStatus.Interrupted
	);
}