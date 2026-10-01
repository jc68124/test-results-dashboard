import { CheckCircleIcon, ClockIcon, MinusCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';

type RunResultsProps = {
	passed: number;
	failed: number;
	pending: number;
	skipped: number;
};

export function RunResults({ passed, failed, pending, skipped }: RunResultsProps) {
	const results = [
		{
			label: 'Passed',
			count: passed,
			Icon: CheckCircleIcon,
			colour: 'text-green-600 dark:text-green-400',
		},
		{
			label: 'Failed',
			count: failed,
			Icon: XCircleIcon,
			colour: 'text-red-600 dark:text-red-400',
		},
		{
			label: 'Pending',
			count: pending,
			Icon: ClockIcon,
			colour: 'text-amber-500 dark:text-amber-400',
		},
		{
			label: 'Skipped',
			count: skipped,
			Icon: MinusCircleIcon,
			colour: 'text-zinc-500 dark:text-zinc-400',
		},
	] as const;

	return (
		<div className="flex items-center justify-end gap-3 whitespace-nowrap">
			{results.map(({ label, count, Icon, colour }) => (
				<span
					key={label}
					title={`${count} ${label.toLowerCase()}`}
					aria-label={`${count} ${label.toLowerCase()}`}
					className={`inline-flex items-center gap-1 text-sm tabular-nums ${
						count === 0 ? 'text-zinc-300 dark:text-zinc-600' : colour
					}`}
				>
					<Icon className="size-4" aria-hidden="true" />
					{count}
				</span>
			))}
		</div>
	);
}
