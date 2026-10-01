'use client';

import { Button } from '@/components/catalyst/button';
import { Dialog, DialogActions, DialogBody, DialogTitle } from '@/components/catalyst/dialog';
import { Field, Label } from '@/components/catalyst/fieldset';
import { Input } from '@/components/catalyst/input';
import { useToast } from '@/contexts/toastContext';
import { createProject } from '@/lib/api/projects';
import { PlusIcon } from '@heroicons/react/20/solid';
import { type FormEvent, useState } from 'react';

export default function CreateProject({ refreshProjects }: { refreshProjects: () => void }) {
	const [isOpen, setIsOpen] = useState(false);
	const [name, setName] = useState('');
	const [loading, setLoading] = useState(false);
	const { addToast } = useToast();

	const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const projectName = name.trim();

		if (!projectName) {
			return;
		}

		setLoading(true);

		try {
			await createProject({ name: projectName });
			setIsOpen(false);
			setName('');
			addToast('Project created successfully', undefined, 'success');
			refreshProjects();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			addToast('Failed to create project', errorMessage, 'error');
		} finally {
			setLoading(false);
		}
	};

	const closeDialog = () => {
		if (loading) return;
		setIsOpen(false);
		setName('');
	};

	return (
		<>
			<Button type="button" onClick={() => setIsOpen(true)} className="cursor-pointer">
				<PlusIcon />
				New project
			</Button>
			<Dialog open={isOpen} onClose={closeDialog} size="md">
				<DialogTitle>New project</DialogTitle>
				<DialogBody>
					<form id="create-project-form" onSubmit={handleCreateProject}>
						<Field>
							<Label>Name</Label>
							<Input
								type="text"
								placeholder="e.g. Customer portal"
								value={name}
								onChange={(event) => setName(event.target.value)}
								disabled={loading}
								autoFocus
							/>
						</Field>
					</form>
				</DialogBody>
				<DialogActions>
					<Button type="button" onClick={closeDialog} className="cursor-pointer" plain disabled={loading}>
						Cancel
					</Button>
					<Button
						type="submit"
						form="create-project-form"
						className="cursor-pointer"
						disabled={loading || !name.trim()}
					>
						{loading ? 'Creating…' : 'Create project'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
