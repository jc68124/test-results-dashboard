import {
	ApiSuccess,
	IngestionKeyCreatedResponse,
	IngestionKeyCreatedResponseSchema,
	PublicIngestKey,
	PublicIngestKeySchema,
} from '@jc68124/test-results-dashboard-api-types';
import { z } from 'zod';
import { apiRequest, Options } from './core';

export function getProjectIngestionKeys(
	publicId: string,
	options: Options = {}
): Promise<ApiSuccess<PublicIngestKey[]>> {
	return apiRequest(`/api/projects/${publicId}/ingestion-keys`, z.array(PublicIngestKeySchema), {
		method: 'GET',
		apiFetcher: options.apiFetcher,
	});
}

export function createIngestionKey(
	publicId: string,
	name: string,
	expiresAt: Date | null,
	options: Options = {}
): Promise<ApiSuccess<IngestionKeyCreatedResponse>> {
	return apiRequest(`/api/projects/${publicId}/ingestion-keys`, IngestionKeyCreatedResponseSchema, {
		method: 'POST',
		body: {
			name,
			expiresAt,
		},
		apiFetcher: options.apiFetcher,
	});
}

export function revokeIngestionKey(
	publicId: string,
	keyPublicId: string,
	options: Options = {}
): Promise<ApiSuccess<null>> {
	return apiRequest(`/api/projects/${publicId}/ingestion-keys/${keyPublicId}/revoke`, z.null(), {
		method: 'POST',
		apiFetcher: options.apiFetcher,
	});
}

export function deleteIngestionKey(
	publicId: string,
	keyPublicId: string,
	options: Options = {}
): Promise<ApiSuccess<null>> {
	return apiRequest(`/api/projects/${publicId}/ingestion-keys/${keyPublicId}`, z.null(), {
		method: 'DELETE',
		apiFetcher: options.apiFetcher,
	});
}
