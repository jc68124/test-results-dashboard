import { Divider } from '@/components/catalyst/divider';
import { Heading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import type { Metadata } from 'next';
import ProjectRunsList from './projectRunsList';

export const metadata: Metadata = {
	title: 'Project Runs',
};

export default function ProjectRuns() {
	return (
		<>
			<Heading>Project Runs</Heading>

			<Text className="mt-2">Review recent test executions and their results.</Text>

			<Divider className="my-6" />

			<ProjectRunsList />
		</>
	);
}
