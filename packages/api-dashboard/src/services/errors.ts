import { ErrorCode } from "@jc68124/test-results-dashboard-api-types";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ApiError extends Error {
	public readonly status: ContentfulStatusCode;
	public readonly code: ErrorCode;
	public readonly details?: unknown;

	public constructor(
		status: ContentfulStatusCode,
		code: ErrorCode,
		message: string,
		details?: unknown,
	) {
		super(message);

		this.name = new.target.name;
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export class NotFoundError extends ApiError {
	public constructor(message = 'Resource not found.') {
		super(404, ErrorCode.NotFound, message);
	}
}

export class AlreadyExistsError extends ApiError {
	public constructor(message = 'Resource already exists.') {
		super(409, ErrorCode.AlreadyExists, message);
	}
}

export class ConflictError extends ApiError {
	public constructor(message = 'The requested action conflicts with the current resource state.') {
		super(409, ErrorCode.Conflict, message);
	}
}

export class ValidationError extends ApiError {
	public constructor(message = 'Validation error.', details?: unknown) {
		super(400, ErrorCode.ValidationError, message, details);
	}
}

export class InternalServerError extends ApiError {
	public constructor(message = 'Internal server error.', details?: unknown) {
		super(500, ErrorCode.InternalServerError, message, details);
	}
}
