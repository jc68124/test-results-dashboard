import { z } from 'zod';

export const TestStatus = {
	Passed: 'passed',
	Failed: 'failed',
	Pending: 'pending',
	Skipped: 'skipped',
	TimedOut: 'timedOut',
	Interrupted: 'interrupted',
} as const;

export type TestStatus = (typeof TestStatus)[keyof typeof TestStatus];

export const TestStatusSchema = z.enum(TestStatus);
