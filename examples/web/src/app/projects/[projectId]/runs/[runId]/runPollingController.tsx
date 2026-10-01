'use client';

import { useRun } from '@/contexts/runContext';
import { getRunDisplayStatus } from '@/lib/runPresentation';
import { useEffect } from 'react';

const POLLING_INTERVAL_MS = 15_000;

export default function RunPollingController() {
	const { run, refreshRun } = useRun();
	const displayStatus = getRunDisplayStatus(run);

	useEffect(() => {
		if (displayStatus !== 'running') {
			return;
		}

		let cancelled = false;
		let timeout: number;

		const poll = async () => {
			try {
				await refreshRun();
			} catch {
				console.error('Failed to refresh run data');
			} finally {
				if (!cancelled) {
					timeout = window.setTimeout(() => {
						void poll();
					}, POLLING_INTERVAL_MS);
				}
			}
		};

		timeout = window.setTimeout(poll, POLLING_INTERVAL_MS);

		return () => {
			cancelled = true;
			window.clearTimeout(timeout);
		};
	}, [displayStatus, refreshRun]);

	return null;
}
