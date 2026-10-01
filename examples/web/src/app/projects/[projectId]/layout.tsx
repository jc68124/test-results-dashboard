import 'server-only';

import { ProjectApplicationLayout } from '@/components/layouts/project-application-layout';
import { ProjectProvider } from '@/contexts/projectContext';
import { getProject } from '@/lib/api/projects.server';
import { notFound } from 'next/navigation';

export default async function ProjectLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{
		projectId: string;
	}>;
}) {
	const { projectId } = await params;

	let project;

	try {
		project = await getProject(projectId);
	} catch {
		notFound();
	}

	return (
		<ProjectProvider projectId={projectId} initialProject={project.data}>
			<ProjectApplicationLayout projectId={projectId}>{children}</ProjectApplicationLayout>
		</ProjectProvider>
	);
}
