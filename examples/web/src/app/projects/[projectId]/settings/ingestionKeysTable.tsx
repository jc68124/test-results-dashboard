'use client';

import { Badge } from '@/components/catalyst/badge';
import { Button } from '@/components/catalyst/button';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/catalyst/dialog';
import { Dropdown, DropdownButton, DropdownDivider, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { Description, Field, FieldGroup, Fieldset, Label } from '@/components/catalyst/fieldset';
import { Subheading } from '@/components/catalyst/heading';
import { Input } from '@/components/catalyst/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/catalyst/table';
import { Text } from '@/components/catalyst/text';
import { CopyBox } from '@/components/copyBox';
import { LocalDate } from '@/components/localDate';
import { useProject } from '@/contexts/projectContext';
import { useToast } from '@/contexts/toastContext';
import {
	createIngestionKey,
	deleteIngestionKey,
	getProjectIngestionKeys,
	revokeIngestionKey,
} from '@/lib/api/ingestionKeys';
import type { PublicIngestKey } from '@jc68124/test-results-dashboard-api-types';
import { EllipsisHorizontalIcon, KeyIcon, NoSymbolIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useCallback, useEffect, useState } from 'react';

type KeyAction = {
	type: 'revoke' | 'delete';
	key: PublicIngestKey;
};

type KeyStatus = {
	label: 'Active' | 'Expired' | 'Revoked';
	colour: 'green' | 'amber' | 'red';
};

export default function IngestionKeysTable() {
	const { project } = useProject();
	const { addToast } = useToast();
	const [keys, setKeys] = useState<PublicIngestKey[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentTime, setCurrentTime] = useState<number | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [keyName, setKeyName] = useState('');
	const [expiresAt, setExpiresAt] = useState('');
	const [isKeyOpen, setIsKeyOpen] = useState(false);
	const [newKey, setNewKey] = useState('');
	const [pendingAction, setPendingAction] = useState<KeyAction | null>(null);
	const [actioningKeyId, setActioningKeyId] = useState<string | null>(null);

	const fetchIngestionKeys = useCallback(async () => {
		setLoading(true);

		try {
			const ingestionKeys = await getProjectIngestionKeys(project.publicId);
			setKeys(ingestionKeys.data);
		} catch (error) {
			addToast(
				'Failed to fetch ingestion keys',
				error instanceof Error ? error.message : 'Unknown error',
				'error'
			);
		} finally {
			setLoading(false);
		}
	}, [project.publicId, addToast]);

	useEffect(() => {
		void fetchIngestionKeys();
	}, [fetchIngestionKeys]);

	useEffect(() => {
		const updateCurrentTime = () => {
			setCurrentTime(Date.now());
		};

		updateCurrentTime();

		const interval = window.setInterval(updateCurrentTime, 60_000);

		return () => window.clearInterval(interval);
	}, []);

	async function handleCreateIngestionKey() {
		const normalizedKeyName = keyName.trim();
		const expirationDate = expiresAt ? new Date(expiresAt) : null;

		if (!normalizedKeyName || creating) {
			return;
		}

		if (expirationDate && expirationDate.getTime() <= Date.now()) {
			addToast('Invalid expiration date', 'The expiration date must be in the future.', 'error');
			return;
		}

		setCreating(true);

		try {
			const response = await createIngestionKey(
				project.publicId,
				normalizedKeyName,
				expiresAt ? new Date(expiresAt) : null
			);
			const { apiKey, ...createdKey } = response.data;

			setKeys((previousKeys) => [createdKey, ...previousKeys]);
			setNewKey(apiKey);
			setIsCreateOpen(false);
			setKeyName('');
			setExpiresAt('');
			setIsKeyOpen(true);
			addToast('Ingestion key created', `${createdKey.name} is ready to use.`, 'success');
		} catch (error) {
			addToast(
				'Failed to create ingestion key',
				error instanceof Error ? error.message : 'Unknown error',
				'error'
			);
		} finally {
			setCreating(false);
		}
	}

	async function handleConfirmedAction() {
		if (!pendingAction || actioningKeyId) {
			return;
		}

		const { type, key } = pendingAction;
		setActioningKeyId(key.publicId);

		try {
			if (type === 'revoke') {
				await revokeIngestionKey(project.publicId, key.publicId);
				setKeys((previousKeys) =>
					previousKeys.map((existingKey) =>
						existingKey.publicId === key.publicId ? { ...existingKey, revokedAt: new Date() } : existingKey
					)
				);
				addToast('Ingestion key revoked', `${key.name} can no longer send test results.`, 'success');
			} else {
				await deleteIngestionKey(project.publicId, key.publicId);
				setKeys((previousKeys) => previousKeys.filter((existingKey) => existingKey.publicId !== key.publicId));
				addToast('Ingestion key deleted', `${key.name} has been permanently deleted.`, 'success');
			}

			setPendingAction(null);
		} catch (error) {
			addToast(
				`Failed to ${type} ingestion key`,
				error instanceof Error ? error.message : 'Unknown error',
				'error'
			);
		} finally {
			setActioningKeyId(null);
		}
	}

	function closeCreateDialog() {
		if (creating) {
			return;
		}

		setIsCreateOpen(false);
		setKeyName('');
		setExpiresAt('');
	}

	function closeKeyDialog() {
		setIsKeyOpen(false);
		setNewKey('');
	}

	function closeActionDialog() {
		if (actioningKeyId) {
			return;
		}

		setPendingAction(null);
	}

	return (
		<>
			<section className="overflow-hidden rounded-xl border border-zinc-950/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
				<div className="flex flex-col gap-4 border-b border-zinc-950/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
					<div className="flex items-start gap-3">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
							<KeyIcon className="size-5" aria-hidden="true" />
						</div>
						<div>
							<Subheading>Ingestion keys</Subheading>
							<Text className="mt-1">Create and manage the credentials allowed to send results.</Text>
						</div>
					</div>

					<Button type="button" className="cursor-pointer" onClick={() => setIsCreateOpen(true)}>
						Create key
					</Button>
				</div>

				<div className="p-5 sm:p-6">
					{loading ? (
						<KeysLoadingState />
					) : keys.length === 0 ? (
						<KeysEmptyState onCreate={() => setIsCreateOpen(true)} />
					) : (
						<Table dense className="[--gutter:--spacing(0)]">
							<TableHead>
								<TableRow>
									<TableHeader>Name</TableHeader>
									<TableHeader className="hidden sm:table-cell">Key</TableHeader>
									<TableHeader className="hidden lg:table-cell">Last used</TableHeader>
									<TableHeader className="hidden xl:table-cell">Expires</TableHeader>
									<TableHeader className="w-12 text-right">
										<span className="sr-only">Actions</span>
									</TableHeader>
								</TableRow>
							</TableHead>
							<TableBody>
								{keys.map((key) => {
									const status = getKeyStatus(key, currentTime);
									const canRevoke = status.label === 'Active';
									const isActioning = actioningKeyId === key.publicId;

									return (
										<TableRow key={key.publicId}>
											<TableCell>
												<div className="font-medium text-zinc-950 dark:text-white">
													{key.name}
												</div>
												<div className="mt-1 flex items-center gap-2 sm:hidden">
													<code className="text-xs text-zinc-500 dark:text-zinc-400">
														{key.prefix}…
													</code>
													<Badge color={status.colour}>{status.label}</Badge>
												</div>
												<div className="mt-1 hidden sm:block">
													<Badge color={status.colour}>{status.label}</Badge>
												</div>
											</TableCell>
											<TableCell className="hidden sm:table-cell">
												<code className="text-xs text-zinc-600 dark:text-zinc-300">
													{key.prefix}…
												</code>
											</TableCell>
											<TableCell className="hidden text-zinc-500 lg:table-cell dark:text-zinc-400">
												{key.lastUsedAt ? <LocalDate value={key.lastUsedAt} /> : 'Never'}
											</TableCell>
											<TableCell className="hidden text-zinc-500 xl:table-cell dark:text-zinc-400">
												{key.expiresAt ? <LocalDate value={key.expiresAt} /> : 'Never'}
											</TableCell>
											<TableCell className="text-right">
												<Dropdown>
													<DropdownButton
														plain
														aria-label={`Actions for ${key.name}`}
														disabled={isActioning}
													>
														<EllipsisHorizontalIcon />
													</DropdownButton>
													<DropdownMenu anchor="bottom end">
														<DropdownItem
															disabled={!canRevoke}
															onClick={() => setPendingAction({ type: 'revoke', key })}
														>
															<NoSymbolIcon />
															Revoke key
														</DropdownItem>
														<DropdownDivider />
														<DropdownItem
															className="text-red-600 dark:text-red-400"
															onClick={() => setPendingAction({ type: 'delete', key })}
														>
															<TrashIcon />
															Delete key
														</DropdownItem>
													</DropdownMenu>
												</Dropdown>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</div>
			</section>

			<Dialog open={isCreateOpen} onClose={closeCreateDialog} size="md">
				<DialogTitle>Create ingestion key</DialogTitle>
				<DialogDescription>Create a separate key for each CI environment or integration.</DialogDescription>
				<DialogBody>
					<Fieldset>
						<FieldGroup>
							<Field>
								<Label>Key name</Label>
								<Description>Choose a name that identifies where the key will be used.</Description>
								<Input
									type="text"
									placeholder="Production CI"
									value={keyName}
									onChange={(event) => setKeyName(event.target.value)}
									autoComplete="off"
									disabled={creating}
									required
								/>
							</Field>
							<Field>
								<Label>Expiration date</Label>
								<Description>Leave empty to create a key that does not expire.</Description>
								<Input
									type="datetime-local"
									value={expiresAt}
									onChange={(event) => setExpiresAt(event.target.value)}
									disabled={creating}
								/>
							</Field>
						</FieldGroup>
					</Fieldset>
				</DialogBody>
				<DialogActions>
					<Button
						type="button"
						onClick={closeCreateDialog}
						className="cursor-pointer"
						plain
						disabled={creating}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleCreateIngestionKey}
						className="cursor-pointer"
						disabled={creating || keyName.trim().length === 0}
					>
						{creating ? 'Creating…' : 'Create key'}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={isKeyOpen} onClose={closeKeyDialog} size="lg">
				<DialogTitle>Ingestion key created</DialogTitle>
				<DialogDescription>
					Copy and store this key securely. For security, it will not be shown again.
				</DialogDescription>
				<DialogBody>
					<CopyBox value={newKey} />
				</DialogBody>
				<DialogActions>
					<Button type="button" onClick={closeKeyDialog} className="cursor-pointer">
						I have saved the key
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={pendingAction !== null} onClose={closeActionDialog} size="md">
				<DialogTitle>
					{pendingAction?.type === 'delete' ? 'Delete ingestion key?' : 'Revoke ingestion key?'}
				</DialogTitle>
				<DialogDescription>
					{pendingAction?.type === 'delete'
						? `${pendingAction.key.name} will be permanently removed. This action cannot be undone.`
						: `${pendingAction?.key.name ?? 'This key'} will immediately stop accepting test results. It can still be deleted later.`}
				</DialogDescription>
				<DialogActions>
					<Button
						type="button"
						onClick={closeActionDialog}
						className="cursor-pointer"
						plain
						disabled={!!actioningKeyId}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleConfirmedAction}
						className="cursor-pointer"
						color={pendingAction?.type === 'delete' ? 'red' : undefined}
						disabled={!!actioningKeyId}
					>
						{actioningKeyId
							? pendingAction?.type === 'delete'
								? 'Deleting…'
								: 'Revoking…'
							: pendingAction?.type === 'delete'
								? 'Delete key'
								: 'Revoke key'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

function KeysLoadingState() {
	return (
		<div className="space-y-3" aria-label="Loading ingestion keys">
			{Array.from({ length: 3 }).map((_, index) => (
				<div key={index} className="h-12 animate-pulse rounded-lg bg-zinc-950/5 dark:bg-white/5" />
			))}
		</div>
	);
}

function KeysEmptyState({ onCreate }: { onCreate: () => void }) {
	return (
		<div className="rounded-lg border border-dashed border-zinc-950/10 px-6 py-10 text-center dark:border-white/10">
			<div className="mx-auto flex size-11 items-center justify-center rounded-full bg-zinc-950/5 dark:bg-white/10">
				<KeyIcon className="size-5 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
			</div>
			<div className="mt-4 text-sm font-medium text-zinc-950 dark:text-white">No ingestion keys</div>
			<Text className="mt-1">Create a key before connecting a test reporter.</Text>
			<Button type="button" plain className="mt-3 cursor-pointer" onClick={onCreate}>
				Create your first key
			</Button>
		</div>
	);
}

function getKeyStatus(key: PublicIngestKey, currentTime: number | null): KeyStatus {
	if (key.revokedAt) {
		return { label: 'Revoked', colour: 'red' };
	}

	if (currentTime !== null && key.expiresAt && key.expiresAt.getTime() <= currentTime) {
		return { label: 'Expired', colour: 'amber' };
	}

	return { label: 'Active', colour: 'green' };
}
