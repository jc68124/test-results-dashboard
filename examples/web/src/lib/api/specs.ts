import {
	type FullSpec,
	FullSpecSchema,
	PaginatedApiMeta,
	PaginatedApiSuccess,
	SpecResultFilter,
} from '@jc68124/test-results-dashboard-api-types';
import { z } from 'zod';
import { apiRequest, Options } from './core';

export function getRunSpecs(
	projectPublicId: string,
	runPublicId: string,
	page: number,
	pageSize: number,
	result: SpecResultFilter = SpecResultFilter.All,
	options: Options = {}
): Promise<PaginatedApiSuccess<FullSpec[]>> {
	const searchParams = new URLSearchParams({
		page: page.toString(),
		pageSize: pageSize.toString(),
	});

	if (result !== SpecResultFilter.All) {
		searchParams.set('result', result);
	}

	return apiRequest<FullSpec[], PaginatedApiMeta>(
		`/api/projects/${projectPublicId}/runs/${runPublicId}/specs?${searchParams.toString()}`,
		z.array(FullSpecSchema),
		{
			method: 'GET',
			apiFetcher: options.apiFetcher,
		}
	);
}
