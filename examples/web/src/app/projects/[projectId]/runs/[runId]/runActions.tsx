'use client';

import { Button } from '@/components/catalyst/button';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/catalyst/dialog';
import { Dropdown, DropdownButton, DropdownDivider, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { Field, Label } from '@/components/catalyst/fieldset';
import { Input } from '@/components/catalyst/input';
import { useProject } from '@/contexts/projectContext';
import { useRun } from '@/contexts/runContext';
import { useToast } from '@/contexts/toastContext';
import { cancelProjectRun, deleteProjectRun, renameProjectRun } from '@/lib/api/runs';
import { formatRunName } from '@/lib/runPresentation';
import { canCancelRun } from '@jc68124/test-results-dashboard-api-types';
import { EllipsisHorizontalIcon, NoSymbolIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';
import { useState, type SubmitEvent } from 'react';

export default function RunActions() {
	const { project } = useProject();
	const { run, setRun } = useRun();
	const { addToast } = useToast();
	const router = useRouter();
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [isCancelOpen, setIsCancelOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [name, setName] = useState('');
	const [action, setAction] = useState<'rename' | 'cancel' | 'delete' | null>(null);

	const runCanBeCancelled = canCancelRun(run.status);
	const normalizedName = name.trim();

	function openRenameDialog() {
		setName(formatRunName(run));
		setIsRenameOpen(true);
	}

	async function handleRename(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!normalizedName || action) {
			return;
		}

		setAction('rename');

		try {
			const response = await renameProjectRun(project.publicId, run.publicId, normalizedName);
			setRun(response.data);
			setIsRenameOpen(false);
			addToast('Run renamed', `The run is now named ${response.data.name}.`, 'success');
		} catch (error) {
			addToast('Failed to rename run', getErrorMessage(error), 'error');
		} finally {
			setAction(null);
		}
	}

	async function handleCancel(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!runCanBeCancelled || action) {
			return;
		}

		setAction('cancel');

		try {
			const response = await cancelProjectRun(project.publicId, run.publicId);
			setRun(response.data);
			setIsCancelOpen(false);
			addToast('Run cancelled', 'Further reporter events for this run will be ignored.', 'success');
		} catch (error) {
			addToast('Failed to cancel run', getErrorMessage(error), 'error');
		} finally {
			setAction(null);
		}
	}

	async function handleDelete(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		if (runCanBeCancelled || action) {
			return;
		}

		setAction('delete');

		try {
			await deleteProjectRun(project.publicId, run.publicId);
			addToast('Run deleted', 'The run and all of its results have been permanently deleted.', 'success');
			router.replace(`/projects/${project.publicId}/runs`);
			router.refresh();
		} catch (error) {
			addToast('Failed to delete run', getErrorMessage(error), 'error');
			setAction(null);
		}
	}

	return (
		<>
			<Dropdown>
				<DropdownButton plain aria-label="Run actions" className="cursor-pointer">
					<EllipsisHorizontalIcon />
				</DropdownButton>
				<DropdownMenu anchor="bottom end">
					<DropdownItem onClick={openRenameDialog} className="cursor-pointer">
						<PencilSquareIcon />
						Rename run
					</DropdownItem>
					<DropdownItem
						disabled={!runCanBeCancelled}
						onClick={() => setIsCancelOpen(true)}
						className={runCanBeCancelled ? 'cursor-pointer' : 'cursor-not-allowed'}
					>
						<NoSymbolIcon />
						Cancel run
					</DropdownItem>
					<DropdownDivider />
					<DropdownItem
						className={`text-red-600 dark:text-red-400 ${!runCanBeCancelled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
						disabled={runCanBeCancelled}
						onClick={() => setIsDeleteOpen(true)}
					>
						<TrashIcon />
						Delete run
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>

			<Dialog open={isRenameOpen} onClose={() => action !== 'rename' && setIsRenameOpen(false)} size="md">
				<form onSubmit={handleRename}>
					<DialogTitle>Rename run</DialogTitle>
					<DialogDescription>
						Add a descriptive name that makes this run easier to identify.
					</DialogDescription>
					<DialogBody>
						<Field>
							<Label>Run name</Label>
							<Input
								type="text"
								value={name}
								onChange={(event) => setName(event.target.value)}
								maxLength={120}
								autoComplete="off"
								disabled={action === 'rename'}
								autoFocus
								required
							/>
						</Field>
					</DialogBody>
					<DialogActions>
						<Button
							type="button"
							plain
							onClick={() => setIsRenameOpen(false)}
							disabled={action === 'rename'}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!normalizedName || action === 'rename'}
							className={!normalizedName ? 'cursor-not-allowed' : 'cursor-pointer'}
						>
							{action === 'rename' ? 'Renaming…' : 'Rename run'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			<Dialog open={isCancelOpen} onClose={() => action !== 'cancel' && setIsCancelOpen(false)} size="md">
				<form onSubmit={handleCancel}>
					<DialogTitle>Cancel {formatRunName(run)}?</DialogTitle>
					<DialogDescription>
						The run will be closed and any later results sent by its reporter will be ignored.
					</DialogDescription>
					<DialogActions>
						<Button
							type="button"
							plain
							onClick={() => setIsCancelOpen(false)}
							disabled={action === 'cancel'}
							className="cursor-pointer"
						>
							Keep run
						</Button>
						<Button
							type="submit"
							color="red"
							disabled={action === 'cancel'}
							className="cursor-pointer"
							autoFocus
						>
							{action === 'cancel' ? 'Cancelling…' : 'Cancel run'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			<Dialog open={isDeleteOpen} onClose={() => action !== 'delete' && setIsDeleteOpen(false)} size="md">
				<form onSubmit={handleDelete}>
					<DialogTitle>Delete {formatRunName(run)}?</DialogTitle>
					<DialogDescription>
						This permanently removes the run, its specs, tests, attempts, and attributes. This action cannot
						be undone.
					</DialogDescription>
					<DialogActions>
						<Button
							type="button"
							plain
							onClick={() => setIsDeleteOpen(false)}
							disabled={action === 'delete'}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							color="red"
							disabled={action === 'delete'}
							className="cursor-pointer"
							autoFocus
						>
							{action === 'delete' ? 'Deleting…' : 'Delete run'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>
		</>
	);
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'Unknown error';
}
