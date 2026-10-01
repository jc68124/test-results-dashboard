'use client';

import { Navbar } from '@/components/catalyst/navbar';
import {
	Sidebar,
	SidebarBody,
	SidebarHeader,
	SidebarItem,
	SidebarLabel,
	SidebarSection,
	SidebarSpacer,
} from '@/components/catalyst/sidebar';
import { SidebarLayout } from '@/components/catalyst/sidebar-layout';
import { useProject } from '@/contexts/projectContext';
import { ArrowLeftIcon, ChartBarIcon, ClockIcon, Cog8ToothIcon } from '@heroicons/react/20/solid';
import { usePathname } from 'next/navigation';

export function ProjectApplicationLayout({ children, projectId }: { children: React.ReactNode; projectId: string }) {
	let pathname = usePathname();
	const { project } = useProject();
	const baseHref = `/projects/${projectId}`;

	return (
		<SidebarLayout
			navbar={<Navbar></Navbar>}
			sidebar={
				<Sidebar>
					<SidebarHeader>
						<SidebarItem href="/">
							<SidebarLabel>Test Results</SidebarLabel>
						</SidebarItem>
					</SidebarHeader>

					<SidebarBody>
						<SidebarSection>
							<SidebarItem>
								<SidebarLabel>{project.name}</SidebarLabel>
							</SidebarItem>

							<SidebarItem href={`${baseHref}`} current={pathname === baseHref}>
								<ChartBarIcon />
								<SidebarLabel>Overview</SidebarLabel>
							</SidebarItem>

							<SidebarItem href={`${baseHref}/runs`} current={pathname.startsWith(`${baseHref}/runs`)}>
								<ClockIcon />
								<SidebarLabel>Runs</SidebarLabel>
							</SidebarItem>

							<SidebarItem
								href={`${baseHref}/settings`}
								current={pathname.startsWith(`${baseHref}/settings`)}
							>
								<Cog8ToothIcon />
								<SidebarLabel>Settings</SidebarLabel>
							</SidebarItem>
						</SidebarSection>

						<SidebarSpacer />

						<SidebarSection>
							<SidebarItem href="/">
								<ArrowLeftIcon />
								<SidebarLabel>Back to Projects</SidebarLabel>
							</SidebarItem>
						</SidebarSection>
					</SidebarBody>
				</Sidebar>
			}
		>
			{children}
		</SidebarLayout>
	);
}
