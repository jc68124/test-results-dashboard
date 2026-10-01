import { Heading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import type { Metadata } from 'next';
import ProjectSettingsClient from './projectSettingsClient';

export const metadata: Metadata = {
	title: 'Project Settings',
};

export default async function ProjectSettings() {
	return (
		<div>
			<Heading>Project settings</Heading>
			<Text className="mt-2">Manage project identity, ingestion access, and stored test results.</Text>

			<ProjectSettingsClient />
		</div>
	);
}
