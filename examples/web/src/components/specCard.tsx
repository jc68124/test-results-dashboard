'use client';

import { Badge } from '@/components/catalyst/badge';
import { RunResults } from '@/components/runResults';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import {
	CheckCircleIcon,
	ChevronDownIcon,
	ClockIcon,
	DocumentTextIcon,
	ExclamationTriangleIcon,
	MinusCircleIcon,
	StopCircleIcon,
	XCircleIcon,
} from '@heroicons/react/20/solid';
import { FullSpec } from '@jc68124/test-results-dashboard-api-types';
import clsx from 'clsx';

type SpecTest = FullSpec['specTests'][number];
type SpecTestAttempt = SpecTest['specTestAttempts'][number];

type SpecCardProps = {
	spec: FullSpec;
};

export function SpecCard({ spec }: SpecCardProps) {
	return (
		<Disclosure
			as="article"
			className="overflow-hidden rounded-xl border border-zinc-950/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
		>
			{({ open }) => (
				<>
					<DisclosureButton className="flex w-full flex-col gap-4 px-4 py-4 text-left sm:flex-row sm:items-center sm:px-6">
						<div className="flex min-w-0 flex-1 items-start gap-3">
							<DocumentTextIcon className="mt-0.5 size-5 shrink-0 text-zinc-400" aria-hidden="true" />

							<div className="min-w-0">
								<div
									className="truncate text-sm font-semibold text-zinc-950 dark:text-white"
									title={spec.filename}
								>
									{spec.filename}
								</div>

								<div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
									{spec.tests} {spec.tests === 1 ? 'test' : 'tests'}
									<span aria-hidden="true"> · </span>
									{formatDuration(spec.duration)}
								</div>
							</div>
						</div>

						<div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
							<RunResults
								passed={spec.passed}
								failed={spec.failed}
								pending={spec.pending}
								skipped={spec.skipped}
							/>

							<StatusBadge status={spec.status} />

							<ChevronDownIcon
								className={clsx(
									'size-5 shrink-0 text-zinc-400 transition-transform',
									open && 'rotate-180'
								)}
								aria-hidden="true"
							/>
						</div>
					</DisclosureButton>

					<DisclosurePanel className="border-t border-zinc-950/10 dark:border-white/10">
						{spec.specTests.length === 0 ? (
							<div className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
								No tests were recorded for this spec.
							</div>
						) : (
							<div className="divide-y divide-zinc-950/5 dark:divide-white/5">
								{groupTestsBySuite(spec.specTests).map(({ key, title, tests }) => (
									<section key={key} aria-label={title || 'Tests'}>
										{title && (
											<h3 className="bg-zinc-50 px-4 py-3 text-xs font-semibold wrap-break-word text-zinc-600 sm:px-6 dark:bg-zinc-950/40 dark:text-zinc-300">
												{title}
											</h3>
										)}
										<div className="divide-y divide-zinc-950/5 dark:divide-white/5">
											{tests.map((test) => (
												<SpecTestRow key={test.id} test={test} />
											))}
										</div>
									</section>
								))}
							</div>
						)}
					</DisclosurePanel>
				</>
			)}
		</Disclosure>
	);
}

function groupTestsBySuite(tests: SpecTest[]) {
	const groups = new Map<string, { key: string; title: string; tests: SpecTest[] }>();

	for (const test of tests) {
		const suitePath = [...test.titleParts]
			.sort((a, b) => a.position - b.position)
			.slice(0, -1)
			.map((part) => part.value);
		// Match the actual describe parts, including names containing the separator.
		const key = JSON.stringify(suitePath);
		const group = groups.get(key);

		if (group) {
			group.tests.push(test);
		} else {
			groups.set(key, { key, title: suitePath.join(' › '), tests: [test] });
		}
	}

	return [...groups.values()];
}

function SpecTestRow({ test }: { test: SpecTest }) {
	const hasDetails = Boolean(test.message) || Boolean(test.trace);

	const summary = <SpecTestSummary test={test} expandable={hasDetails} />;

	if (!hasDetails) {
		return <div className="px-4 py-3 sm:px-6">{summary}</div>;
	}

	return (
		<Disclosure>
			{({ open }) => (
				<>
					<DisclosureButton className="block w-full px-4 py-3 text-left transition hover:bg-zinc-950/2.5 sm:px-6 dark:hover:bg-white/5">
						<SpecTestSummary test={test} expandable open={open} />
					</DisclosureButton>

					<DisclosurePanel>
						<TestDetails test={test} />
					</DisclosurePanel>
				</>
			)}
		</Disclosure>
	);
}

function SpecTestSummary({ test, expandable, open = false }: { test: SpecTest; expandable: boolean; open?: boolean }) {
	const orderedParts = [...test.titleParts].sort((a, b) => a.position - b.position);

	const testName = orderedParts.at(-1)?.value ?? 'Untitled test';

	return (
		<div className="flex items-start gap-3">
			<StatusIcon status={test.status} className="mt-0.5 size-5 shrink-0" />

			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium text-zinc-950 dark:text-white" title={testName}>
					{testName}
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-3">
				<AttemptSummary attempts={test.specTestAttempts} finalStatus={test.status} />
				<span className="min-w-14 text-right text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
					{formatDuration(test.duration)}
				</span>

				{expandable && (
					<ChevronDownIcon
						className={clsx('size-4 text-zinc-400 transition-transform', open && 'rotate-180')}
						aria-hidden="true"
					/>
				)}
			</div>
		</div>
	);
}

function TestDetails({ test }: { test: SpecTest }) {
	if (!test.message && !test.trace) {
		return null;
	}

	return (
		<div className="bg-zinc-50 px-4 py-4 sm:px-12 dark:bg-zinc-950/40">
			<ErrorDetails message={test.message} trace={test.trace} />
		</div>
	);
}

function ErrorDetails({ message, trace }: { message: string | null; trace: string | null }) {
	return (
		<div className="overflow-hidden rounded-lg border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10">
			{message && (
				<div className="px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap text-red-700 dark:text-red-300">
					{message}
				</div>
			)}

			{trace && (
				<pre className="max-h-64 overflow-auto border-t border-red-200 px-3 py-3 text-xs whitespace-pre-wrap text-red-700 dark:border-red-500/20 dark:text-red-300">
					{trace}
				</pre>
			)}
		</div>
	);
}

function StatusIcon({ status, className }: { status: string; className?: string }) {
	switch (status) {
		case 'passed':
			return (
				<CheckCircleIcon
					className={clsx(className, 'text-green-600 dark:text-green-400')}
					aria-label="Passed"
				/>
			);

		case 'failed':
			return <XCircleIcon className={clsx(className, 'text-red-600 dark:text-red-400')} aria-label="Failed" />;

		case 'pending':
		case 'partial':
		case 'running':
			return (
				<ClockIcon
					className={clsx(className, 'text-amber-500 dark:text-amber-400')}
					aria-label={formatStatus(status)}
				/>
			);

		case 'skipped':
			return (
				<MinusCircleIcon className={clsx(className, 'text-zinc-500 dark:text-zinc-400')} aria-label="Skipped" />
			);

		case 'timedOut':
			return (
				<ExclamationTriangleIcon
					className={clsx(className, 'text-red-600 dark:text-red-400')}
					aria-label="Timed out"
				/>
			);

		case 'interrupted':
			return (
				<StopCircleIcon
					className={clsx(className, 'text-orange-500 dark:text-orange-400')}
					aria-label="Interrupted"
				/>
			);

		default:
			return <ClockIcon className={clsx(className, 'text-zinc-400')} aria-label={formatStatus(status)} />;
	}
}

function StatusBadge({ status }: { status: string }) {
	const colour = (() => {
		switch (status) {
			case 'passed':
				return 'green';
			case 'failed':
			case 'timedOut':
				return 'red';
			case 'pending':
			case 'partial':
			case 'running':
				return 'amber';
			case 'interrupted':
				return 'orange';
			default:
				return 'zinc';
		}
	})();

	return <Badge color={colour}>{formatStatus(status)}</Badge>;
}

function formatStatus(status: string) {
	if (status === 'timedOut') {
		return 'Timed out';
	}

	return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function formatDuration(milliseconds: number) {
	if (milliseconds < 1_000) {
		return `${milliseconds}ms`;
	}

	if (milliseconds < 60_000) {
		return `${(milliseconds / 1_000).toFixed(1)}s`;
	}

	const minutes = Math.floor(milliseconds / 60_000);
	const seconds = Math.floor((milliseconds % 60_000) / 1_000);

	return `${minutes}m ${seconds}s`;
}

function AttemptSummary({ attempts, finalStatus }: { attempts: SpecTestAttempt[]; finalStatus: string }) {
	if (attempts.length <= 1) {
		return null;
	}

	const hadFailedAttempt = attempts.some((attempt) => attempt.status === 'failed');

	const flaky = finalStatus === 'passed' && hadFailedAttempt;

	const description = attempts
		.map((attempt, index) => `Attempt ${index + 1}: ${formatStatus(attempt.status)}`)
		.join(' · ');

	const colour = flaky ? 'amber' : finalStatus === 'failed' ? 'red' : 'zinc';

	return (
		<span title={description} aria-label={description}>
			<Badge color={colour}>{flaky ? `Flaky · ${attempts.length}` : `${attempts.length} attempts`}</Badge>
		</span>
	);
}
