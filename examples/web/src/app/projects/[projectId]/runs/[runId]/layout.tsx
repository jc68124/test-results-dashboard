import 'server-only';

import { RunProvider } from '@/contexts/runContext';
import { getProjectRun } from '@/lib/api/runs.server';
import { notFound } from 'next/navigation';
import RunPollingController from './runPollingController';

export default async function RunLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{
		projectId: string;
		runId: string;
	}>;
}) {
	const { projectId, runId } = await params;

	let run;

	try {
		run = await getProjectRun(projectId, runId);
	} catch {
		notFound();
	}

	return (
		<RunProvider projectId={projectId} runId={runId} initialRun={run.data}>
			<RunPollingController />
			{children}
		</RunProvider>
	);
}
