'use client';

import { Button } from '@/components/catalyst/button';
import { useRun } from '@/contexts/runContext';
import { useToast } from '@/contexts/toastContext';
import { ArrowPathIcon } from '@heroicons/react/20/solid';

export default function RunRefreshButton() {
	const { refreshRun, refreshing } = useRun();
	const { addToast } = useToast();

	async function handleRefresh() {
		try {
			await refreshRun();
		} catch (error) {
			addToast('Failed to refresh run', error instanceof Error ? error.message : 'Unknown error', 'error');
		}
	}

	return (
		<Button
			type="button"
			outline
			className="shrink-0 cursor-pointer"
			disabled={refreshing}
			onClick={() => void handleRefresh()}
		>
			<ArrowPathIcon className={refreshing ? 'animate-spin' : undefined} />
			{refreshing ? 'Refreshing…' : 'Refresh'}
		</Button>
	);
}
