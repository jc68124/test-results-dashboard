import {
	ApiSuccess,
	ProjectRunsApiSuccess,
	ProjectRunsMeta,
	RunResultFilter,
	RunWithStats,
	RunWithStatsSchema,
} from '@jc68124/test-results-dashboard-api-types';
import { z } from 'zod';
import { apiRequest, Options } from './core';

export type ProjectRunsQuery = {
	page: number;
	pageSize: number;
	attributeKey?: string;
	attributeValue?: string;
	result?: RunResultFilter;
};

export function getProjectRuns(
	publicId: string,
	query: ProjectRunsQuery,
	options: Options = {}
): Promise<ProjectRunsApiSuccess> {
	const searchParams = new URLSearchParams({
		page: query.page.toString(),
		pageSize: query.pageSize.toString(),
	});

	if (query.attributeKey) {
		searchParams.set('attributeKey', query.attributeKey);
	}

	if (query.attributeValue) {
		searchParams.set('attributeValue', query.attributeValue);
	}

	if (query.result && query.result !== RunResultFilter.All) {
		searchParams.set('result', query.result);
	}

	return apiRequest<RunWithStats[], ProjectRunsMeta>(
		`/api/projects/${publicId}/runs?${searchParams.toString()}`,
		z.array(RunWithStatsSchema),
		{
			method: 'GET',
			apiFetcher: options.apiFetcher,
		}
	);
}

export function getProjectRun(
	publicId: string,
	runId: string,
	options: Options = {}
): Promise<ApiSuccess<RunWithStats>> {
	return apiRequest<RunWithStats>(`/api/projects/${publicId}/runs/${runId}`, RunWithStatsSchema, {
		method: 'GET',
		apiFetcher: options.apiFetcher,
	});
}

export function renameProjectRun(
	publicId: string,
	runId: string,
	name: string,
	options: Options = {}
): Promise<ApiSuccess<RunWithStats>> {
	return apiRequest<RunWithStats>(`/api/projects/${publicId}/runs/${runId}`, RunWithStatsSchema, {
		method: 'PATCH',
		body: { name },
		apiFetcher: options.apiFetcher,
	});
}

export function cancelProjectRun(
	publicId: string,
	runId: string,
	options: Options = {}
): Promise<ApiSuccess<RunWithStats>> {
	return apiRequest<RunWithStats>(`/api/projects/${publicId}/runs/${runId}/cancel`, RunWithStatsSchema, {
		method: 'POST',
		apiFetcher: options.apiFetcher,
	});
}

export function deleteProjectRun(publicId: string, runId: string, options: Options = {}): Promise<ApiSuccess<null>> {
	return apiRequest<null>(`/api/projects/${publicId}/runs/${runId}`, z.null(), {
		method: 'DELETE',
		apiFetcher: options.apiFetcher,
	});
}
