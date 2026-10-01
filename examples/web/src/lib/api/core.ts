import type { ApiMeta, ApiResponse, ApiSuccess } from '@jc68124/test-results-dashboard-api-types';
import { z } from 'zod';

export type ApiFetcher = (path: string, init: RequestInit) => Promise<Response>;

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
	body?: unknown;
	apiFetcher?: ApiFetcher;
};

const defaultFetcher: ApiFetcher = (path, init) => {
	return fetch(path, init);
};

export type Options = {
	apiFetcher?: ApiFetcher;
};

export async function apiRequest<T, TMeta extends ApiMeta | undefined = undefined>(
	path: string,
	schema: z.Schema<T>,
	options: ApiRequestOptions = {}
): Promise<ApiSuccess<T, TMeta>> {
	const { body, apiFetcher = defaultFetcher, ...requestOptions } = options;

	const headers = new Headers(requestOptions.headers);

	if (body !== undefined && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const response = await apiFetcher(path, {
		...requestOptions,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	const json = (await response.json()) as ApiResponse<unknown, TMeta>;

	if (!response.ok || !json.success) {
		throw new Error(!json.success ? json.error.message : 'API request failed');
	}

	try {
		const data = schema.parse(json.data);

		return {
			...json,
			data,
		} as ApiSuccess<T, TMeta>;
	} catch (error) {
		console.error('Failed to parse API response:', error);
		throw new Error('Failed to parse API response');
	}
}
