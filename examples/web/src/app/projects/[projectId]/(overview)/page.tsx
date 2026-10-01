import { Divider } from '@/components/catalyst/divider';
import { Heading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import { getProjectOverview } from '@/lib/api/overview.server';
import { OverviewPeriodDaysSchema, type OverviewPeriodDays } from '@jc68124/test-results-dashboard-api-types';
import clsx from 'clsx';
import type { Metadata } from 'next';
import Link from 'next/link';
import ProjectOverviewDashboard from './projectOverviewDashboard';

export const metadata: Metadata = {
	title: 'Project Overview',
};

const PERIOD_OPTIONS: OverviewPeriodDays[] = [7, 14, 30, 60, 90];

export default async function ProjectOverview({
	params,
	searchParams,
}: {
	params: Promise<{
		projectId: string;
	}>;
	searchParams: Promise<{
		days?: string | string[];
	}>;
}) {
	const [{ projectId }, query] = await Promise.all([params, searchParams]);
	const days = parsePeriodDays(query.days);
	const overview = await getProjectOverview(projectId, days);

	return (
		<>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<Heading>Project Overview</Heading>
					<Text className="mt-2">Track test health and performance across recent runs.</Text>
				</div>

				<nav
					className="grid w-full grid-cols-3 gap-1 rounded-lg bg-zinc-950/5 p-1 sm:flex sm:w-fit"
					aria-label="Overview period"
				>
					{PERIOD_OPTIONS.map((option) => (
						<Link
							key={option}
							href={`/projects/${projectId}?days=${option}`}
							aria-current={days === option ? 'page' : undefined}
							className={clsx(
								'rounded-md px-3 py-1.5 text-center text-sm font-medium transition',
								days === option
									? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white'
									: 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
							)}
						>
							{option} days
						</Link>
					))}
				</nav>
			</div>

			<Divider className="my-6" />

			<ProjectOverviewDashboard projectPublicId={projectId} overview={overview.data} />
		</>
	);
}

function parsePeriodDays(value: string | string[] | undefined): OverviewPeriodDays {
	const parsed = OverviewPeriodDaysSchema.safeParse(Array.isArray(value) ? value[0] : value);

	return parsed.success ? parsed.data : 7;
}
