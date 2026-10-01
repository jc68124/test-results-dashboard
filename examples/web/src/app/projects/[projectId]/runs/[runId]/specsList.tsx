'use client';

import { Paginator } from '@/components/paginator';
import { SpecCard } from '@/components/specCard';
import { useProject } from '@/contexts/projectContext';
import { useRun } from '@/contexts/runContext';
import { useToast } from '@/contexts/toastContext';
import { getRunSpecs } from '@/lib/api/specs';
import { parseSpecResultFilter } from '@/lib/specResults';
import {
	DEFAULT_PAGE_SIZE,
	type FullSpec,
	type PaginationMeta,
	SpecResultFilter,
} from '@jc68124/test-results-dashboard-api-types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function SpecsList() {
	const searchParams = useSearchParams();
	const { project } = useProject();
	const { run } = useRun();
	const runUpdatedAt = run.updatedAt.getTime();
	const { addToast } = useToast();
	const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
	const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const selectedResult = parseSpecResultFilter(searchParams.get('result'));
	const requestKey = JSON.stringify([project.publicId, run.publicId, page, selectedResult]);
	const [specs, setSpecs] = useState<FullSpec[]>([]);
	const [loadedRequestKey, setLoadedRequestKey] = useState<string>();
	const loadedRequestKeyRef = useRef<string | undefined>(undefined);
	const [pagination, setPagination] = useState<PaginationMeta>({
		page: 1,
		pageSize: DEFAULT_PAGE_SIZE,
		total: 0,
		totalPages: 0,
	});
	const loading = loadedRequestKey !== requestKey;

	useEffect(() => {
		let cancelled = false;
		const isBackgroundRefresh = loadedRequestKeyRef.current === requestKey;

		void getRunSpecs(project.publicId, run.publicId, page, DEFAULT_PAGE_SIZE, selectedResult)
			.then((response) => {
				if (cancelled) {
					return;
				}

				setSpecs(response.data);
				setPagination(response.meta.pagination);
				loadedRequestKeyRef.current = requestKey;
				setLoadedRequestKey(requestKey);
			})
			.catch((error: unknown) => {
				if (cancelled) {
					return;
				}

				addToast('Failed to fetch specs', error instanceof Error ? error.message : 'Unknown error', 'error');

				if (!isBackgroundRefresh) {
					setSpecs([]);
					setPagination({
						page,
						pageSize: DEFAULT_PAGE_SIZE,
						total: 0,
						totalPages: 0,
					});
				}

				loadedRequestKeyRef.current = requestKey;
				setLoadedRequestKey(requestKey);
			});

		return () => {
			cancelled = true;
		};
	}, [addToast, page, project.publicId, requestKey, run.publicId, runUpdatedAt, selectedResult]);

	return (
		<>
			<div className="space-y-4">
				{loading ? (
					<SpecsLoadingState />
				) : specs.length === 0 ? (
					<div className="rounded-xl border border-dashed border-zinc-950/10 px-6 py-12 text-center text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
						{selectedResult === SpecResultFilter.All
							? 'No specs have been recorded for this run.'
							: 'No specs match this result filter.'}
					</div>
				) : (
					specs.map((spec) => <SpecCard key={spec.id} spec={spec} />)
				)}
			</div>

			<div className="mx-auto my-6 max-w-2xl">
				<Paginator
					currentPage={pagination.page}
					totalPages={pagination.totalPages}
					pathname={`/projects/${project.publicId}/runs/${run.publicId}`}
					searchParams={{
						result: selectedResult === SpecResultFilter.All ? undefined : selectedResult,
					}}
				/>
			</div>
		</>
	);
}

function SpecsLoadingState() {
	return (
		<div className="space-y-4" aria-label="Loading specs">
			{Array.from({ length: 3 }).map((_, index) => (
				<div key={index} className="h-24 animate-pulse rounded-xl bg-zinc-950/5 dark:bg-white/5" />
			))}
		</div>
	);
}
