'use client';

import { Badge } from '@/components/catalyst/badge';
import { Button } from '@/components/catalyst/button';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/catalyst/dialog';
import { Description, Field, Label } from '@/components/catalyst/fieldset';
import { Subheading } from '@/components/catalyst/heading';
import { Input } from '@/components/catalyst/input';
import { Switch, SwitchField } from '@/components/catalyst/switch';
import { Text } from '@/components/catalyst/text';
import { CopyBox } from '@/components/copyBox';
import { useProject } from '@/contexts/projectContext';
import { useToast } from '@/contexts/toastContext';
import { deleteProject, editProject } from '@/lib/api/projects';
import { ExclamationTriangleIcon, IdentificationIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';
import { useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import IngestionKeysTable from './ingestionKeysTable';

export default function ProjectSettings() {
	const { project, setProject } = useProject();
	const { addToast } = useToast();
	const router = useRouter();

	const [name, setName] = useState(project.name);
	const [active, setActive] = useState(project.active);
	const [saving, setSaving] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState('');
	const [deleting, setDeleting] = useState(false);

	const normalizedName = name.trim();
	const isDirty = normalizedName !== project.name || active !== project.active;
	const canSave = normalizedName.length > 0 && isDirty && !saving;
	const canDelete = deleteConfirmation === project.name && !deleting;

	async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!canSave) {
			return;
		}

		setSaving(true);

		try {
			const updatedProject = await editProject(project.publicId, {
				name: normalizedName,
				active,
			});

			setProject(updatedProject.data);
			setName(updatedProject.data.name);
			setActive(updatedProject.data.active);

			addToast('Project updated', 'Your project settings have been saved.', 'success');
		} catch (error) {
			console.error(error);
			addToast('Failed to update project', error instanceof Error ? error.message : 'Unknown error', 'error');
		} finally {
			setSaving(false);
		}
	}

	async function handleDeleteProject() {
		if (!canDelete) {
			return;
		}

		setDeleting(true);

		try {
			await deleteProject(project.publicId);
			addToast('Project deleted', 'Your project has been deleted successfully.', 'success');
			router.replace('/');
		} catch (error) {
			console.error(error);
			addToast('Failed to delete project', error instanceof Error ? error.message : 'Unknown error', 'error');
			setDeleting(false);
		}
	}

	function openDeleteDialog() {
		setDeleteConfirmation('');
		setIsDeleteOpen(true);
	}

	function closeDeleteDialog() {
		if (deleting) {
			return;
		}

		setIsDeleteOpen(false);
		setDeleteConfirmation('');
	}

	return (
		<>
			<div className="mt-8 space-y-6">
				<SettingsPanel
					icon={IdentificationIcon}
					title="Project details"
					description="Update the name and status used throughout the dashboard."
					action={<Badge color={active ? 'green' : 'zinc'}>{active ? 'Active' : 'Inactive'}</Badge>}
				>
					<form onSubmit={handleSubmit}>
						<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
							<Field>
								<Label>Project name</Label>
								<Description>This name appears in the project list and navigation.</Description>
								<Input
									type="text"
									value={name}
									onChange={(event) => setName(event.target.value)}
									placeholder="Enter project name"
									autoComplete="off"
									invalid={normalizedName.length === 0}
									required
								/>
							</Field>

							<SwitchField className="rounded-lg border border-zinc-950/10 p-4 dark:border-white/10">
								<Label>Active project</Label>
								<Description>Mark whether this project is currently in use.</Description>
								<Switch name="active" color="green" checked={active} onChange={setActive} />
							</SwitchField>
						</div>

						<div className="mt-8 border-t border-zinc-950/5 pt-6 dark:border-white/5">
							<div className="max-w-2xl">
								<div className="mb-2 text-sm font-medium text-zinc-950 dark:text-white">Project ID</div>
								<Text className="mb-3">Use this identifier when configuring a test reporter.</Text>
								<CopyBox value={project.publicId} />
							</div>

							<div className="mt-6 flex items-center justify-end gap-3">
								{isDirty && normalizedName.length > 0 && (
									<span className="text-sm text-amber-600 dark:text-amber-400">Unsaved changes</span>
								)}
								<Button type="submit" className="cursor-pointer" disabled={!canSave}>
									{saving ? 'Saving…' : 'Save changes'}
								</Button>
							</div>
						</div>
					</form>
				</SettingsPanel>

				<IngestionKeysTable />

				<SettingsPanel
					icon={ExclamationTriangleIcon}
					title="Danger zone"
					description="Permanently delete this project and all of its test results."
					danger
					action={
						<Button type="button" color="red" className="cursor-pointer" onClick={openDeleteDialog}>
							Delete project
						</Button>
					}
				>
					<Text>
						This action cannot be undone. Existing reporters using this project ID will stop working.
					</Text>
				</SettingsPanel>
			</div>

			<Dialog open={isDeleteOpen} onClose={closeDeleteDialog} size="md">
				<DialogTitle>Delete {project.name}?</DialogTitle>
				<DialogDescription>
					This permanently removes the project, its ingestion keys, runs, specs, tests, and attempts.
				</DialogDescription>
				<DialogBody>
					<Field>
						<Label>
							Type <strong>{project.name}</strong> to confirm
						</Label>
						<Input
							type="text"
							value={deleteConfirmation}
							onChange={(event) => setDeleteConfirmation(event.target.value)}
							autoComplete="off"
							disabled={deleting}
						/>
					</Field>
				</DialogBody>
				<DialogActions>
					<Button
						type="button"
						onClick={closeDeleteDialog}
						className="cursor-pointer"
						plain
						disabled={deleting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleDeleteProject}
						className="cursor-pointer"
						color="red"
						disabled={!canDelete}
					>
						{deleting ? 'Deleting…' : 'Delete project'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

type SettingsPanelProps = {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	title: string;
	description: string;
	action?: ReactNode;
	danger?: boolean;
	children: ReactNode;
};

function SettingsPanel({ icon: Icon, title, description, action, danger = false, children }: SettingsPanelProps) {
	return (
		<section
			className={
				danger
					? 'overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm dark:border-red-500/30 dark:bg-zinc-900'
					: 'overflow-hidden rounded-xl border border-zinc-950/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900'
			}
		>
			<div
				className={
					danger
						? 'flex flex-col gap-4 border-b border-red-200 bg-red-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/20 dark:bg-red-500/5'
						: 'flex flex-col gap-4 border-b border-zinc-950/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/5'
				}
			>
				<div className="flex items-start gap-3">
					<div
						className={
							danger
								? 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400'
								: 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400'
						}
					>
						<Icon className="size-5" aria-hidden="true" />
					</div>
					<div>
						<Subheading>{title}</Subheading>
						<Text className="mt-1">{description}</Text>
					</div>
				</div>
				{action && <div className="shrink-0">{action}</div>}
			</div>

			<div className="p-5 sm:p-6">{children}</div>
		</section>
	);
}
