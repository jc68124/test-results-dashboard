import type { ErrorCode } from './errors.js';

export type ApiSuccess<
	T,
	TMeta extends ApiMeta | undefined = undefined,
> = {
	success: true;
	data: T;
} & (TMeta extends undefined
	? {}
	: {
		meta: TMeta;
	});

export type PaginatedApiSuccess<T> =
	ApiSuccess<T, PaginatedApiMeta>;

export type ApiFailure = {
	success: false;
	error: ApiError;
};

export type ApiResponse<
	T,
	TMeta extends ApiMeta | undefined = undefined,
> =
	| ApiSuccess<T, TMeta>
	| ApiFailure;

export type PaginatedApiResponse<T> =
	ApiResponse<T, PaginatedApiMeta>;

export type ApiMeta = {
	pagination?: PaginationMeta;
};

export type PaginatedApiMeta = {
	pagination: PaginationMeta;
};

export type PaginationMeta = {
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
};

export type ApiError = {
	code: ErrorCode;
	message: string;
	details?: unknown;
};