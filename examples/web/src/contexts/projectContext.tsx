'use client';

import { getProject } from '@/lib/api/projects';
import type { Project } from '@jc68124/test-results-dashboard-api-types';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ProjectContextValue = {
	project: Project;
	refreshProject: () => Promise<void>;
	setProject: (project: Project) => void;
};

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

type ProjectProviderProps = {
	projectId: string;
	initialProject: Project;
	children: ReactNode;
};

export function ProjectProvider({ projectId, initialProject, children }: ProjectProviderProps) {
	const [project, setProject] = useState<Project>(initialProject);

	const refreshProject = useCallback(async () => {
		const project = await getProject(projectId);

		setProject(project.data);
	}, [projectId]);

	const value = useMemo(
		() => ({
			project,
			refreshProject,
			setProject,
		}),
		[project, refreshProject]
	);

	return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
	const context = useContext(ProjectContext);

	if (!context) {
		throw new Error('useProject must be used within a ProjectProvider');
	}

	return context;
}
