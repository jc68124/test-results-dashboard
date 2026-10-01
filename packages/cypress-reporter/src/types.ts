import type { RunAttributeInput } from '@jc68124/test-results-dashboard-core';

export interface CypressReporterOptions {
	endpoint: string;
	token?: string;
	projectId: string;
	runId?: string;
	runName?: string;
	runAttributes?: RunAttributeInput[];
	collectGitMetadata?: boolean;
	branch?: string;
	commitSha?: string;
	commitMessage?: string;
	machineId?: string;
	shardId?: string;
	debug?: boolean;
	headers?: Record<string, string>;
	sendRunStart?: boolean;
	sendSpecs?: boolean;
	sendRunFinish?: boolean;
}

export type CypressAfterRunResult = CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult;
