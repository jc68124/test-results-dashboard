import { Divider } from '@/components/catalyst/divider';
import { Subheading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import type { Metadata } from 'next';
import RunRefreshButton from './runRefreshButton';
import RunSummary from './runSummary';
import SpecResultFilterSelect from './specResultFilter';
import SpecsTable from './specsList';

export const metadata: Metadata = {
	title: 'Project Run Details',
};

export default function ProjectRunDetails() {
	return (
		<>
			<RunSummary />

			<div className="mt-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<Subheading>Specs</Subheading>
					<Text className="mt-1">Results grouped by spec file.</Text>
				</div>

				<div className="flex items-center gap-2">
					<SpecResultFilterSelect />
					<RunRefreshButton />
				</div>
			</div>

			<Divider className="my-4" />

			<SpecsTable />
		</>
	);
}
