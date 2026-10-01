'use client';

import { Select } from '@/components/catalyst/select';
import { useProject } from '@/contexts/projectContext';
import { useRun } from '@/contexts/runContext';
import { parseSpecResultFilter, SPEC_RESULT_FILTER_OPTIONS } from '@/lib/specResults';
import { SpecResultFilter } from '@jc68124/test-results-dashboard-api-types';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SpecResultFilterSelect() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { project } = useProject();
	const { run } = useRun();
	const selectedResult = parseSpecResultFilter(searchParams.get('result'));

	function updateResult(result: SpecResultFilter) {
		const params = new URLSearchParams(searchParams.toString());
		params.delete('page');

		if (result === SpecResultFilter.All) {
			params.delete('result');
		} else {
			params.set('result', result);
		}

		const queryString = params.toString();
		const pathname = `/projects/${project.publicId}/runs/${run.publicId}`;

		router.push(queryString ? `${pathname}?${queryString}` : pathname);
	}

	return (
		<Select
			aria-label="Filter specs by result"
			className="w-36"
			value={selectedResult}
			onChange={(event) => updateResult(parseSpecResultFilter(event.target.value))}
		>
			{SPEC_RESULT_FILTER_OPTIONS.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</Select>
	);
}
