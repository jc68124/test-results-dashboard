import {
	RunResultFilter,
	RunResultFilterSchema,
	type RunWithStats,
} from '@jc68124/test-results-dashboard-api-types';
import {
	ArrowPathIcon,
	CheckCircleIcon,
	ExclamationTriangleIcon,
	StopCircleIcon,
	XCircleIcon,
} from '@heroicons/react/20/solid';

export type RunDisplayStatus = 'passed' | 'failed' | 'running' | 'timedOut' | 'interrupted' | 'cancelled' | 'finished';

export type RunBadgeColour = 'blue' | 'green' | 'red' | 'amber' | 'orange' | 'zinc';

export type RunStatusPresentation = {
	label: string;
	badgeColour: RunBadgeColour;
	accentColour: string;
	iconColour: string;
	iconAnimation?: string;
	Icon: typeof CheckCircleIcon;
};

export const RUN_RESULT_FILTER_OPTIONS = [
	{ value: RunResultFilter.All, label: 'All runs' },
	{ value: RunResultFilter.Failed, label: 'Has failures' },
	{ value: RunResultFilter.Passed, label: 'Passed' },
	{ value: RunResultFilter.Running, label: 'Running' },
	{ value: RunResultFilter.Pending, label: 'Has pending' },
	{ value: RunResultFilter.Skipped, label: 'Has skipped' },
	{ value: RunResultFilter.TimedOut, label: 'Timed out' },
	{ value: RunResultFilter.Interrupted, label: 'Interrupted' },
	{ value: RunResultFilter.Cancelled, label: 'Cancelled' },
	{ value: RunResultFilter.NoResults, label: 'Finished without results' },
] as const;

const STATUS_PRESENTATION: Record<RunDisplayStatus, RunStatusPresentation> = {
	running: {
		label: 'Running',
		badgeColour: 'blue',
		accentColour: 'bg-blue-500',
		iconColour: 'text-blue-500 dark:text-blue-400',
		iconAnimation: 'animate-spin',
		Icon: ArrowPathIcon,
	},
	passed: {
		label: 'Passed',
		badgeColour: 'green',
		accentColour: 'bg-green-500',
		iconColour: 'text-green-600 dark:text-green-400',
		Icon: CheckCircleIcon,
	},
	failed: {
		label: 'Failed',
		badgeColour: 'red',
		accentColour: 'bg-red-500',
		iconColour: 'text-red-600 dark:text-red-400',
		Icon: XCircleIcon,
	},
	timedOut: {
		label: 'Timed out',
		badgeColour: 'orange',
		accentColour: 'bg-orange-500',
		iconColour: 'text-orange-500 dark:text-orange-400',
		Icon: ExclamationTriangleIcon,
	},
	interrupted: {
		label: 'Interrupted',
		badgeColour: 'amber',
		accentColour: 'bg-amber-500',
		iconColour: 'text-amber-500 dark:text-amber-400',
		Icon: StopCircleIcon,
	},
	cancelled: {
		label: 'Cancelled',
		badgeColour: 'zinc',
		accentColour: 'bg-zinc-500',
		iconColour: 'text-zinc-500 dark:text-zinc-400',
		Icon: StopCircleIcon,
	},
	finished: {
		label: 'Finished',
		badgeColour: 'zinc',
		accentColour: 'bg-zinc-400',
		iconColour: 'text-zinc-500 dark:text-zinc-400',
		Icon: CheckCircleIcon,
	},
};

export function getRunDisplayStatus(run: Pick<RunWithStats, 'status' | 'stats'>): RunDisplayStatus {
	const status = normalizeStatus(run.status);

	if (status === 'running') {
		return 'running';
	}

	if (status === 'timedout') {
		return 'timedOut';
	}

	if (status === 'interrupted') {
		return 'interrupted';
	}

	if (status === 'cancelled') {
		return 'cancelled';
	}

	if (status === 'failed' || run.stats.failed > 0) {
		return 'failed';
	}

	if (status === 'finished' && run.stats.tests === 0) {
		return 'finished';
	}

	if (status === 'finished' || status === 'passed') {
		return 'passed';
	}

	return 'finished';
}

export function getRunStatusPresentation(status: RunDisplayStatus): RunStatusPresentation {
	return STATUS_PRESENTATION[status];
}

export function parseRunResultFilter(value: string | null): RunResultFilter {
	const parsedResult = RunResultFilterSchema.safeParse(value ?? RunResultFilter.All);

	return parsedResult.success ? parsedResult.data : RunResultFilter.All;
}

export function formatVersionedName(name: string, version: string): string {
	const formattedName = formatName(name);

	return isUsefulValue(version) ? `${formattedName} ${version}` : formattedName;
}

export function formatName(value: string): string {
	if (!isUsefulValue(value)) {
		return 'Unknown';
	}

	return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function formatRunName(run: Pick<RunWithStats, 'name' | 'framework'>): string {
	return isUsefulValue(run.name) ? run.name : `${formatName(run.framework)} run`;
}

export function formatRunAttributeKey(key: string): string {
	return key
		.split(/[._-]/)
		.filter(Boolean)
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(' ');
}

export function formatRunDate(date: Date): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}

export function formatDuration(milliseconds: number): string {
	if (milliseconds < 1_000) {
		return `${milliseconds}ms`;
	}

	if (milliseconds < 60_000) {
		const seconds = milliseconds / 1_000;

		return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
	}

	const totalSeconds = Math.round(milliseconds / 1_000);
	const totalMinutes = Math.floor(totalSeconds / 60);
	const remainingSeconds = totalSeconds % 60;

	if (totalMinutes < 60) {
		return remainingSeconds > 0 ? `${totalMinutes}m ${remainingSeconds}s` : `${totalMinutes}m`;
	}

	const hours = Math.floor(totalMinutes / 60);
	const remainingMinutes = totalMinutes % 60;

	return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function isUsefulValue(value: string | null | undefined): value is string {
	return Boolean(value && value.trim() && value.toLowerCase() !== 'unknown');
}

function normalizeStatus(status: string): string {
	return status.toLowerCase().replaceAll('-', '').replaceAll('_', '').replaceAll(' ', '');
}
