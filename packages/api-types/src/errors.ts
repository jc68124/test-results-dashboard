export const ErrorCode = {
	ValidationError: 'VALIDATION_ERROR',
	Unauthorized: 'UNAUTHORIZED',
	Forbidden: 'FORBIDDEN',
	NotFound: 'NOT_FOUND',
	AlreadyExists: 'ALREADY_EXISTS',
	Conflict: 'CONFLICT',
	InternalServerError: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
