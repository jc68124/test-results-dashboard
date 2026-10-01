import 'server-only';

import { serviceBindingFetcher } from './core.server';
import type { ProjectRunsQuery } from './runs';
import { getProjectRun as getProjectRunBase, getProjectRuns as getProjectRunsBase } from './runs';

export function getProjectRuns(publicId: string, query: ProjectRunsQuery) {
	return getProjectRunsBase(publicId, query, {
		apiFetcher: serviceBindingFetcher,
	});
}

export function getProjectRun(publicId: string, runId: string) {
	return getProjectRunBase(publicId, runId, {
		apiFetcher: serviceBindingFetcher,
	});
}
