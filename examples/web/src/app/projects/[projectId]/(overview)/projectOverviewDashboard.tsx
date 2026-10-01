'use client';

import { Subheading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import { formatDuration, getRunDisplayStatus, getRunStatusPresentation } from '@/lib/runPresentation';
import type { ProjectOverview } from '@jc68124/test-results-dashboard-api-types';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { RunCard } from '../runs/runCard';

type ProjectOverviewDashboardProps = {
	projectPublicId: string;
	overview: ProjectOverview;
};

const numberFormatter = new Intl.NumberFormat('en-GB');

export default function ProjectOverviewDashboard({ projectPublicId, overview }: ProjectOverviewDashboardProps) {
	if (!overview.latestRun) {
		return <NoRunsState projectPublicId={projectPublicId} />;
	}

	return (
		<div className="space-y-8">
			<section aria-labelledby="latest-run-heading">
				<Subheading id="latest-run-heading">Latest run</Subheading>
				<div className="mt-3">
					<RunCard projectPublicId={projectPublicId} run={overview.latestRun} />
				</div>
			</section>

			{overview.summary.runs === 0 ? (
				<NoRunsInPeriodState days={overview.period.days} />
			) : (
				<>
					<SummaryCards overview={overview} />

					<div className="grid gap-6 xl:grid-cols-2">
						<ResultsChart overview={overview} />
						<DurationChart overview={overview} />
					</div>

					<RecentRunHealth projectPublicId={projectPublicId} overview={overview} />
				</>
			)}
		</div>
	);
}

function SummaryCards({ overview }: { overview: ProjectOverview }) {
	const { summary } = overview;
	const passRate = summary.testPassRate === null ? '—' : `${summary.testPassRate.toFixed(1)}%`;
	const duration = summary.medianDuration === null ? '—' : formatDuration(summary.medianDuration);

	const cards = [
		{
			label: 'Test pass rate',
			value: passRate,
			description: 'Passed versus failed tests in completed runs',
		},
		{
			label: 'Successful runs',
			value: `${numberFormatter.format(summary.successfulRuns)} / ${numberFormatter.format(summary.completedRuns)}`,
			description: 'Completed runs with tests and no failures',
		},
		{
			label: 'Tests executed',
			value: numberFormatter.format(summary.tests),
			description: `Across ${numberFormatter.format(summary.runs)} ${summary.runs === 1 ? 'run' : 'runs'}`,
		},
		{
			label: 'Median duration',
			value: duration,
			description: 'Wall-clock duration of completed runs',
		},
	];

	return (
		<section aria-label={`Summary for the last ${overview.period.days} days`}>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{cards.map((card) => (
					<div
						key={card.label}
						className="rounded-xl border border-zinc-950/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900"
					>
						<div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{card.label}</div>
						<div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
							{card.value}
						</div>
						<div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{card.description}</div>
					</div>
				))}
			</div>
		</section>
	);
}

function ResultsChart({ overview }: { overview: ProjectOverview }) {
	const tickInterval =
		overview.period.days === 90
			? 14
			: overview.period.days === 60
				? 9
				: overview.period.days === 30
					? 4
					: overview.period.days === 14
						? 1
						: 0;

	return (
		<ChartPanel title="Test results" description={`Daily results across the last ${overview.period.days} days.`}>
			<MountedChart>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={overview.trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
						<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.12} />
						<XAxis
							dataKey="date"
							tickFormatter={formatTrendDate}
							interval={tickInterval}
							axisLine={false}
							tickLine={false}
							fontSize={12}
						/>
						<YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={12} />
						<Tooltip
							labelFormatter={(label) => formatFullTrendDate(String(label))}
							formatter={(value, name) => [numberFormatter.format(Number(value)), String(name)]}
							contentStyle={tooltipStyle}
							labelStyle={{ color: '#ffffff' }}
							itemStyle={{ color: '#e4e4e7' }}
						/>
						<Legend wrapperStyle={{ fontSize: 12 }} />
						<Bar dataKey="passed" name="Passed" stackId="results" fill="#16a34a" />
						<Bar dataKey="failed" name="Failed" stackId="results" fill="#dc2626" />
						<Bar dataKey="pending" name="Pending" stackId="results" fill="#d97706" />
						<Bar dataKey="skipped" name="Skipped" stackId="results" fill="#71717a" />
					</BarChart>
				</ResponsiveContainer>
			</MountedChart>
		</ChartPanel>
	);
}

function DurationChart({ overview }: { overview: ProjectOverview }) {
	const hasDurations = overview.trend.some((point) => point.medianDuration !== null);
	const tickInterval =
		overview.period.days === 90
			? 14
			: overview.period.days === 60
				? 9
				: overview.period.days === 30
					? 4
					: overview.period.days === 14
						? 1
						: 0;

	return (
		<ChartPanel title="Run duration" description="Daily median wall-clock duration for completed runs.">
			{hasDurations ? (
				<MountedChart>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={overview.trend} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke="currentColor"
								opacity={0.12}
							/>
							<XAxis
								dataKey="date"
								tickFormatter={formatTrendDate}
								interval={tickInterval}
								axisLine={false}
								tickLine={false}
								fontSize={12}
							/>
							<YAxis
								tickFormatter={(value) => formatDuration(Number(value))}
								axisLine={false}
								tickLine={false}
								fontSize={12}
								width={64}
							/>
							<Tooltip
								labelFormatter={(label) => formatFullTrendDate(String(label))}
								formatter={(value) => [formatDuration(Number(value)), 'Median duration']}
								contentStyle={tooltipStyle}
								labelStyle={{ color: '#ffffff' }}
								itemStyle={{ color: '#e4e4e7' }}
							/>
							<Line
								type="monotone"
								dataKey="medianDuration"
								name="Median duration"
								stroke="#2563eb"
								strokeWidth={2}
								dot={{ r: 3, fill: '#2563eb' }}
								activeDot={{ r: 5 }}
								connectNulls={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				</MountedChart>
			) : (
				<div className="flex h-72 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
					No completed run durations in this period.
				</div>
			)}
		</ChartPanel>
	);
}

function ChartPanel({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-xl border border-zinc-950/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
			<Subheading>{title}</Subheading>
			<Text className="mt-1">{description}</Text>
			<div className="mt-5">{children}</div>
		</section>
	);
}

function MountedChart({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className="h-72 animate-pulse rounded-lg bg-zinc-950/5 dark:bg-white/5" />;
	}

	return <div className="h-72 text-zinc-500 dark:text-zinc-400">{children}</div>;
}

function RecentRunHealth({ projectPublicId, overview }: { projectPublicId: string; overview: ProjectOverview }) {
	return (
		<section
			className="rounded-xl border border-zinc-950/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900"
			aria-labelledby="recent-run-health-heading"
		>
			<div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<Subheading id="recent-run-health-heading">Recent run health</Subheading>
					<Text className="mt-1">The latest {overview.recentRuns.length} runs in this period.</Text>
				</div>

				<Link
					href={`/projects/${projectPublicId}/runs`}
					className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
				>
					View all runs
				</Link>
			</div>

			<div className="mt-5 flex flex-wrap gap-2">
				{overview.recentRuns.map((run) => {
					const status = getRunDisplayStatus(run);
					const presentation = getRunStatusPresentation(status);

					return (
						<Link
							key={run.publicId}
							href={`/projects/${projectPublicId}/runs/${run.publicId}`}
							title={`${presentation.label} · ${run.startedAt.toISOString()}`}
							aria-label={`${presentation.label} run started ${run.startedAt.toISOString()}`}
							className="group relative rounded-full p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
						>
							<span
								className={`block size-3 rounded-full ${presentation.accentColour} transition-transform group-hover:scale-125`}
								aria-hidden="true"
							/>
						</Link>
					);
				})}
			</div>
		</section>
	);
}

function NoRunsState({ projectPublicId }: { projectPublicId: string }) {
	return (
		<div className="rounded-xl border border-dashed border-zinc-950/10 px-6 py-16 text-center dark:border-white/10">
			<div className="text-sm font-medium text-zinc-950 dark:text-white">No runs yet</div>
			<div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
				Configure an ingestion key and send your first test run to populate this overview.
			</div>
			<Link
				href={`/projects/${projectPublicId}/settings`}
				className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
			>
				Open project settings
			</Link>
		</div>
	);
}

function NoRunsInPeriodState({ days }: { days: number }) {
	const description =
		days < 90
			? 'Choose a longer period to include older activity.'
			: 'New runs will appear here as soon as results are ingested.';

	return (
		<div className="rounded-xl border border-dashed border-zinc-950/10 px-6 py-12 text-center dark:border-white/10">
			<div className="text-sm font-medium text-zinc-950 dark:text-white">No runs in the last {days} days</div>
			<div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</div>
		</div>
	);
}

function formatTrendDate(value: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC',
	}).format(new Date(`${value}T00:00:00Z`));
}

function formatFullTrendDate(value: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(`${value}T00:00:00Z`));
}

const tooltipStyle = {
	backgroundColor: '#18181b',
	border: '1px solid #3f3f46',
	borderRadius: 8,
	boxShadow: '0 4px 12px rgb(0 0 0 / 0.2)',
};
