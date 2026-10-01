import type { ErrorHandler } from 'hono';
import { ApiError, InternalServerError, ValidationError } from '../services/errors';
import type { ApiFailure } from '@jc68124/test-results-dashboard-api-types';
import { z, ZodError } from 'zod';

export const errorHandler: ErrorHandler = (err, c) => {
	if (err instanceof ZodError) {
		const validationError = new ValidationError();
		return c.json<ApiFailure>({
			success: false,
			error: {
				code: validationError.code,
				message: validationError.message,
				details: z.flattenError(err),
			},
		}, 400);
	}

	if (err instanceof ApiError) {
		return c.json<ApiFailure>({
			success: false,
			error: {
				code: err.code,
				message: err.message,
				...(err.details ? { details: err.details } : {}),
			},
		}, err.status);
	}

	console.error(err);

	const internalServerError = new InternalServerError();
	return c.json<ApiFailure>({
		success: false,
		error: {
			code: internalServerError.code,
			message: internalServerError.message,
		},
	}, internalServerError.status);
};