import {
	ApiSuccess,
	OverviewPeriodDays,
	ProjectOverview,
	ProjectOverviewSchema,
} from '@jc68124/test-results-dashboard-api-types';
import { apiRequest, Options } from './core';

export function getProjectOverview(
	publicId: string,
	days: OverviewPeriodDays,
	options: Options = {}
): Promise<ApiSuccess<ProjectOverview>> {
	return apiRequest<ProjectOverview>(`/api/projects/${publicId}/overview?days=${days}`, ProjectOverviewSchema, {
		method: 'GET',
		apiFetcher: options.apiFetcher,
	});
}
