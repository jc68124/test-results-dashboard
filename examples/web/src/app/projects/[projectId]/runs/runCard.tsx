'use client';

import { Badge } from '@/components/catalyst/badge';
import { LocalDate } from '@/components/localDate';
import { RunResults } from '@/components/runResults';
import {
	formatDuration,
	formatRunAttributeKey,
	formatRunName,
	formatVersionedName,
	getRunDisplayStatus,
	getRunStatusPresentation,
	isUsefulValue,
} from '@/lib/runPresentation';
import type { RunWithStats } from '@jc68124/test-results-dashboard-api-types';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import Link from 'next/link';

type RunCardProps = {
	projectPublicId: string;
	run: RunWithStats;
};

export function RunCard({ projectPublicId, run }: RunCardProps) {
	const displayStatus = getRunDisplayStatus(run);
	const statusStyle = getRunStatusPresentation(displayStatus);
	const StatusIcon = statusStyle.Icon;

	const duration = displayStatus === 'running' ? 'In progress' : formatDuration(run.stats.duration);

	const framework = formatVersionedName(run.framework, run.frameworkVersion);

	const browser = formatVersionedName(run.browser, run.browserVersion);

	const runMetadata = [
		isUsefulValue(run.branch) ? run.branch : undefined,
		framework,
		browser,
		isUsefulValue(run.os) ? run.os : undefined,
	].filter((value): value is string => Boolean(value));

	const visibleAttributes = run.attributes.filter((attribute) => attribute.showOnRunList);

	return (
		<Link
			href={`/projects/${projectPublicId}/runs/${run.publicId}`}
			className={clsx(
				'group relative block overflow-hidden rounded-xl border bg-white shadow-sm transition',
				'border-zinc-950/10 hover:border-zinc-950/20 hover:shadow-md',
				'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
				'dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/20'
			)}
		>
			<div className={clsx('absolute inset-y-0 left-0 w-1', statusStyle.accentColour)} aria-hidden="true" />

			<div className="flex items-start gap-3 py-4 pr-4 pl-5 sm:items-center sm:gap-4 sm:px-6">
				<StatusIcon
					className={clsx(
						'mt-0.5 size-6 shrink-0 sm:mt-0',
						statusStyle.iconColour,
						statusStyle.iconAnimation
					)}
					aria-hidden="true"
				/>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold text-zinc-950 dark:text-white">{formatRunName(run)}</span>

						<Badge color={statusStyle.badgeColour}>{statusStyle.label}</Badge>
					</div>

					<div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
						<LocalDate value={run.startedAt} />

						<Separator />

						<span>
							{run.stats.specs} {run.stats.specs === 1 ? 'spec' : 'specs'}
						</span>

						<Separator />

						<span>
							{run.stats.tests} {run.stats.tests === 1 ? 'test' : 'tests'}
						</span>

						<Separator />

						<span>{duration}</span>
					</div>

					{runMetadata.length > 0 && (
						<div
							className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400"
							title={runMetadata.join(' · ')}
						>
							{runMetadata.join(' · ')}
						</div>
					)}

					{visibleAttributes.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1.5">
							{visibleAttributes.map((attribute) => (
								<Badge key={attribute.key} color="zinc">
									{formatRunAttributeKey(attribute.key)}: {attribute.value}
								</Badge>
							))}
						</div>
					)}
				</div>

				<div className="hidden shrink-0 md:block">
					<RunResults
						passed={run.stats.passed}
						failed={run.stats.failed}
						pending={run.stats.pending}
						skipped={run.stats.skipped}
					/>
				</div>

				<ChevronRightIcon
					className="size-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5"
					aria-hidden="true"
				/>
			</div>

			<div className="border-t border-zinc-950/5 px-4 py-3 md:hidden dark:border-white/5">
				<RunResults
					passed={run.stats.passed}
					failed={run.stats.failed}
					pending={run.stats.pending}
					skipped={run.stats.skipped}
				/>
			</div>
		</Link>
	);
}

function Separator() {
	return (
		<span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">
			·
		</span>
	);
}
