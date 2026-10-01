import { SpecResultFilter, SpecResultFilterSchema } from '@jc68124/test-results-dashboard-api-types';

export const SPEC_RESULT_FILTER_OPTIONS = [
	{ value: SpecResultFilter.All, label: 'All specs' },
	{ value: SpecResultFilter.Failed, label: 'Failed' },
	{ value: SpecResultFilter.Passed, label: 'Passed' },
	{ value: SpecResultFilter.Pending, label: 'Pending' },
	{ value: SpecResultFilter.Skipped, label: 'Skipped' },
] as const;

export function parseSpecResultFilter(value: string | null): SpecResultFilter {
	const parsedResult = SpecResultFilterSchema.safeParse(value ?? SpecResultFilter.All);

	return parsedResult.success ? parsedResult.data : SpecResultFilter.All;
}
