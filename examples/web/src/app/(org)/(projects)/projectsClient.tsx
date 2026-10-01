'use client';

import { Badge } from '@/components/catalyst/badge';
import { Button } from '@/components/catalyst/button';
import { Divider } from '@/components/catalyst/divider';
import { Heading } from '@/components/catalyst/heading';
import { Input, InputGroup } from '@/components/catalyst/input';
import { Select } from '@/components/catalyst/select';
import { Text } from '@/components/catalyst/text';
import { LocalDate } from '@/components/localDate';
import { useToast } from '@/contexts/toastContext';
import { getProjects } from '@/lib/api/projects';
import type { Project } from '@jc68124/test-results-dashboard-api-types';
import { ChevronRightIcon, FolderIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CreateProject from './createProject';

type ProjectStatusFilter = 'all' | 'active' | 'inactive';

const PROJECT_ACCENTS = [
	{
		bar: 'bg-blue-500',
		icon: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
	},
	{
		bar: 'bg-violet-500',
		icon: 'bg-violet-500/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
	},
	{
		bar: 'bg-emerald-500',
		icon: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
	},
	{
		bar: 'bg-orange-500',
		icon: 'bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
	},
] as const;

export function ProjectsClient() {
	const { addToast } = useToast();
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('all');

	const refreshProjects = useCallback(() => {
		setLoading(true);

		getProjects()
			.then((response) => setProjects(response.data))
			.catch((error) => {
				console.error(error);
				addToast('Failed to load projects', error instanceof Error ? error.message : 'Unknown error', 'error');
			})
			.finally(() => {
				setLoading(false);
			});
	}, [addToast]);

	useEffect(() => {
		refreshProjects();
	}, [refreshProjects]);

	const visibleProjects = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return projects
			.filter((project) => {
				const matchesSearch = !normalizedSearch || project.name.toLowerCase().includes(normalizedSearch);
				const matchesStatus =
					statusFilter === 'all' ||
					(statusFilter === 'active' && project.active) ||
					(statusFilter === 'inactive' && !project.active);

				return matchesSearch && matchesStatus;
			})
			.sort((left, right) => {
				if (left.active !== right.active) {
					return left.active ? -1 : 1;
				}

				return left.name.localeCompare(right.name);
			});
	}, [projects, search, statusFilter]);

	const activeProjects = projects.filter((project) => project.active).length;
	const filtersApplied = search.trim().length > 0 || statusFilter !== 'all';

	const clearFilters = () => {
		setSearch('');
		setStatusFilter('all');
	};

	return (
		<>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<Heading>Projects</Heading>
					<Text className="mt-2">Choose a project to review its test health, runs, and configuration.</Text>
				</div>

				<CreateProject refreshProjects={refreshProjects} />
			</div>

			<Divider className="my-6" />

			{loading ? (
				<ProjectsLoadingState />
			) : projects.length === 0 ? (
				<ProjectsEmptyState />
			) : (
				<>
					<div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
						<div>
							<div className="text-sm font-medium text-zinc-950 dark:text-white">
								{projects.length} {projects.length === 1 ? 'project' : 'projects'}
							</div>
							<div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
								{activeProjects} active
								{projects.length - activeProjects > 0 &&
									` · ${projects.length - activeProjects} inactive`}
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-[minmax(16rem,1fr)_10rem] lg:w-auto">
							<InputGroup>
								<MagnifyingGlassIcon />
								<Input
									type="search"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search projects"
									aria-label="Search projects"
								/>
							</InputGroup>

							<Select
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value as ProjectStatusFilter)}
								aria-label="Filter projects by status"
							>
								<option value="all">All statuses</option>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</Select>
						</div>
					</div>

					{visibleProjects.length === 0 ? (
						<NoMatchingProjects clearFilters={clearFilters} />
					) : (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
							{visibleProjects.map((project) => (
								<ProjectCard key={project.publicId} project={project} />
							))}
						</div>
					)}

					{filtersApplied && visibleProjects.length > 0 && (
						<div className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">
							Showing {visibleProjects.length} of {projects.length} projects
						</div>
					)}
				</>
			)}
		</>
	);
}

function ProjectCard({ project }: { project: Project }) {
	const accent = PROJECT_ACCENTS[hashProjectName(project.name) % PROJECT_ACCENTS.length];
	const initials = getProjectInitials(project.name);

	return (
		<Link
			href={`/projects/${project.publicId}`}
			className="group relative overflow-hidden rounded-xl border border-zinc-950/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-950/20 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/20"
		>
			<div className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} aria-hidden="true" />

			<div className="p-5 pt-6">
				<div className="flex items-start gap-4">
					<div
						className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${accent.icon}`}
						aria-hidden="true"
					>
						{initials}
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-3">
							<h2 className="truncate font-semibold text-zinc-950 dark:text-white">{project.name}</h2>
							<ChevronRightIcon
								className="mt-0.5 size-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5"
								aria-hidden="true"
							/>
						</div>

						<div className="mt-2">
							<Badge color={project.active ? 'green' : 'zinc'}>
								{project.active ? 'Active' : 'Inactive'}
							</Badge>
						</div>
					</div>
				</div>

				<div className="mt-5 border-t border-zinc-950/5 pt-4 text-xs text-zinc-500 dark:border-white/5 dark:text-zinc-400">
					Updated <LocalDate value={project.updatedAt} />
				</div>
			</div>
		</Link>
	);
}

function ProjectsLoadingState() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading projects">
			{Array.from({ length: 6 }).map((_, index) => (
				<div key={index} className="h-40 animate-pulse rounded-xl bg-zinc-950/5 dark:bg-white/5" />
			))}
		</div>
	);
}

function ProjectsEmptyState() {
	return (
		<div className="rounded-xl border border-dashed border-zinc-950/10 px-6 py-16 text-center dark:border-white/10">
			<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-zinc-950/5 dark:bg-white/10">
				<FolderIcon className="size-6 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
			</div>
			<div className="mt-4 text-sm font-medium text-zinc-950 dark:text-white">No projects yet</div>
			<div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
				Create your first project to start collecting test results.
			</div>
		</div>
	);
}

function NoMatchingProjects({ clearFilters }: { clearFilters: () => void }) {
	return (
		<div className="rounded-xl border border-dashed border-zinc-950/10 px-6 py-12 text-center dark:border-white/10">
			<div className="text-sm font-medium text-zinc-950 dark:text-white">No matching projects</div>
			<div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
				Try changing your search or status filter.
			</div>
			<Button type="button" plain onClick={clearFilters} className="mt-3 cursor-pointer">
				Clear filters
			</Button>
		</div>
	);
}

function getProjectInitials(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join('');
}

function hashProjectName(name: string): number {
	return Array.from(name).reduce((hash, character) => hash + character.charCodeAt(0), 0);
}
