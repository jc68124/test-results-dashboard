'use client';

import { Button } from '@/components/catalyst/button';
import { useState } from 'react';

type CopyBoxProps = {
	value: string;
};

export function CopyBox({ value }: CopyBoxProps) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => {
				setCopied(false);
			}, 1500);
		} catch (error) {
			setCopied(false);
		}
	}

	return (
		<div className="flex items-center gap-2 rounded-lg border border-zinc-950/10 bg-zinc-50 p-2 dark:border-white/10 dark:bg-white/5">
			<code className="min-w-0 flex-1 truncate px-2 text-sm text-zinc-700 dark:text-zinc-300">{value}</code>

			<Button type="button" onClick={handleCopy} className="cursor-pointer text-sm">
				{copied ? 'Copied' : 'Copy'}
			</Button>
		</div>
	);
}
