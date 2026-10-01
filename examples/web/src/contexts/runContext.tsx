'use client';

import { getProjectRun } from '@/lib/api/runs';
import type { RunWithStats } from '@jc68124/test-results-dashboard-api-types';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type RunContextValue = {
	run: RunWithStats;
	refreshRun: () => Promise<void>;
	refreshing: boolean;
	setRun: (run: RunWithStats) => void;
};

const RunContext = createContext<RunContextValue | undefined>(undefined);

type RunProviderProps = {
	projectId: string;
	runId: string;
	initialRun: RunWithStats;
	children: ReactNode;
};

export function RunProvider({ projectId, runId, initialRun, children }: RunProviderProps) {
	const [run, setRun] = useState<RunWithStats>(initialRun);
	const [refreshing, setRefreshing] = useState(false);
	const refreshPromiseRef = useRef<Promise<void> | null>(null);

	const refreshRun = useCallback(() => {
		if (refreshPromiseRef.current) {
			return refreshPromiseRef.current;
		}

		setRefreshing(true);

		const refreshPromise = getProjectRun(projectId, runId)
			.then((response) => {
				setRun(response.data);
			})
			.finally(() => {
				refreshPromiseRef.current = null;
				setRefreshing(false);
			});

		refreshPromiseRef.current = refreshPromise;

		return refreshPromise;
	}, [projectId, runId]);

	const value = useMemo(
		() => ({
			run,
			refreshRun,
			refreshing,
			setRun,
		}),
		[run, refreshRun, refreshing]
	);

	return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}

export function useRun(): RunContextValue {
	const context = useContext(RunContext);

	if (!context) {
		throw new Error('useRun must be used within a RunProvider');
	}

	return context;
}
