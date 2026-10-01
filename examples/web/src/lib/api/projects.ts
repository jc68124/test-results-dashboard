import {
	ApiSuccess,
	CreateProject,
	EditProject,
	Project,
	ProjectSchema,
} from '@jc68124/test-results-dashboard-api-types';
import { z } from 'zod';
import { apiRequest, Options } from './core';

export function getProjects(options: Options = {}): Promise<ApiSuccess<Project[]>> {
	return apiRequest('/api/projects', z.array(ProjectSchema), {
		method: 'GET',
		cache: 'no-store',
		apiFetcher: options.apiFetcher,
	});
}

export function getProject(publicId: string, options: Options = {}): Promise<ApiSuccess<Project>> {
	return apiRequest(`/api/projects/${publicId}`, ProjectSchema, {
		method: 'GET',
		cache: 'no-store',
		apiFetcher: options.apiFetcher,
	});
}

export function createProject(project: CreateProject, options: Options = {}): Promise<ApiSuccess<Project>> {
	return apiRequest('/api/projects', ProjectSchema, {
		method: 'POST',
		body: project,
		apiFetcher: options.apiFetcher,
	});
}

export function editProject(
	publicId: string,
	project: EditProject,
	options: Options = {}
): Promise<ApiSuccess<Project>> {
	return apiRequest(`/api/projects/${publicId}`, ProjectSchema, {
		method: 'PATCH',
		body: project,
		apiFetcher: options.apiFetcher,
	});
}

export function deleteProject(publicId: string, options: Options = {}): Promise<ApiSuccess<null>> {
	return apiRequest(`/api/projects/${publicId}`, z.null(), {
		method: 'DELETE',
		apiFetcher: options.apiFetcher,
	});
}
