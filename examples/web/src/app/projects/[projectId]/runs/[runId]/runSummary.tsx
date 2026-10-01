'use client';

import { Badge } from '@/components/catalyst/badge';
import { Heading } from '@/components/catalyst/heading';
import { LocalDate } from '@/components/localDate';
import { RunResults } from '@/components/runResults';
import { useRun } from '@/contexts/runContext';
import {
	formatDuration,
	formatRunAttributeKey,
	formatRunName,
	formatVersionedName,
	getRunDisplayStatus,
	getRunStatusPresentation,
	isUsefulValue,
} from '@/lib/runPresentation';
import { type ReactNode } from 'react';
import RunActions from './runActions';

export default function RunSummary() {
	const { run } = useRun();
	const displayStatus = getRunDisplayStatus(run);
	const presentation = getRunStatusPresentation(displayStatus);
	const StatusIcon = presentation.Icon;
	const reporterMetadata = [
		isUsefulValue(run.branch) ? `Branch: ${run.branch}` : undefined,
		isUsefulValue(run.commitSha) ? `Commit: ${run.commitSha.slice(0, 12)}` : undefined,
		isUsefulValue(run.group) ? `Group: ${run.group}` : undefined,
		isUsefulValue(run.machineId) ? `Machine: ${run.machineId}` : undefined,
		isUsefulValue(run.shardId) ? `Shard: ${run.shardId}` : undefined,
		run.parallel !== null ? `Parallel: ${run.parallel ? 'Yes' : 'No'}` : undefined,
	].filter((value): value is string => Boolean(value));

	return (
		<section className="overflow-hidden rounded-xl border border-zinc-950/10 bg-white shadow-xs dark:border-white/10 dark:bg-zinc-900">
			<div className={`h-1 ${presentation.accentColour}`} />

			<div className="p-5 sm:p-6">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
					<div className="flex min-w-0 items-start gap-3">
						<StatusIcon
							className={`mt-1 size-6 shrink-0 ${presentation.iconColour} ${
								presentation.iconAnimation ?? ''
							}`}
							aria-hidden="true"
						/>

						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<Heading>{formatRunName(run)}</Heading>

								<Badge color={presentation.badgeColour}>{presentation.label}</Badge>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<RunResults
							passed={run.stats.passed}
							failed={run.stats.failed}
							pending={run.stats.pending}
							skipped={run.stats.skipped}
						/>
						<RunActions />
					</div>
				</div>

				<div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-zinc-950/10 pt-5 sm:grid-cols-3 lg:grid-cols-5 dark:border-white/10">
					<MetadataItem label="Started" value={<LocalDate value={run.startedAt} />} />

					<MetadataItem
						label="Finished"
						value={run.endedAt ? <LocalDate value={run.endedAt} /> : 'In progress'}
					/>

					<MetadataItem
						label="Elapsed"
						value={run.endedAt ? formatDuration(run.endedAt.getTime() - run.startedAt.getTime()) : '—'}
					/>

					<MetadataItem label="Specs" value={run.stats.specs.toLocaleString()} />

					<MetadataItem label="Tests" value={run.stats.tests.toLocaleString()} />
				</div>

				<div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-950/10 pt-5 dark:border-white/10">
					<MetadataBadge value={formatVersionedName(run.framework, run.frameworkVersion)} />

					<MetadataBadge value={formatVersionedName(run.browser, run.browserVersion)} />

					{isUsefulValue(run.os) && <MetadataBadge value={run.os} />}

					<MetadataBadge value={`${formatDuration(run.stats.duration)} test duration`} />

					{reporterMetadata.map((value) => (
						<MetadataBadge key={value} value={value} />
					))}

					{run.attributes.map((attribute) => (
						<MetadataBadge
							key={attribute.key}
							value={`${formatRunAttributeKey(attribute.key)}: ${attribute.value}`}
						/>
					))}
				</div>

				{isUsefulValue(run.commitMessage) && (
					<div className="mt-4 border-t border-zinc-950/10 pt-4 dark:border-white/10">
						<div className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
							Commit message
						</div>

						<div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{run.commitMessage}</div>
					</div>
				)}
			</div>
		</section>
	);
}

function MetadataItem({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div>
			<div className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">{label}</div>

			<div className="mt-1 text-sm font-medium text-zinc-950 dark:text-white">{value}</div>
		</div>
	);
}

function MetadataBadge({ value }: { value: string }) {
	return (
		<span className="rounded-md bg-zinc-950/5 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
			{value}
		</span>
	);
}
