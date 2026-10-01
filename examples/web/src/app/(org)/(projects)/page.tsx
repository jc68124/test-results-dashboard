import { Metadata } from 'next';
import { ProjectsClient } from './projectsClient';

export const metadata: Metadata = {
	title: 'Projects',
};

export default async function Projects() {
	return <ProjectsClient />;
}
