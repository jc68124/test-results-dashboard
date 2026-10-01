import type { Artifact, DashboardEvent, RunInfo, SpecInfo, TestInfo } from '@jc68124/test-results-dashboard-core';
import type { CypressAfterRunResult, CypressReporterOptions } from './types.js';
import { isFailedRunResult, mapTestStatus } from './utils.js';

function mapScreenshots(screenshots: Array<{ path: string; name: string }>): Artifact[] {
	return screenshots.map((screenshot) => ({
		name: screenshot.name,
		path: screenshot.path,
		type: 'screenshot',
	}));
}

function mapSpecInfo(result: CypressCommandLine.RunResult): SpecInfo {
	return {
		name: result.spec.name,
		relative: result.spec.relative,
		absolute: result.spec.absolute,
		startedAt: result.stats.startedAt,
		endedAt: result.stats.endedAt,
		duration: result.stats.duration,
		tests: result.stats.tests,
		passes: result.stats.passes,
		failures: result.stats.failures,
		pending: result.stats.pending,
		skipped: result.stats.skipped,
		suites: result.stats.suites,
		video: result.video,
		screenshots: mapScreenshots(result.screenshots),
	};
}

function mapTestInfo(test: CypressCommandLine.TestResult): TestInfo {
	return {
		title: test.title,
		status: mapTestStatus(test.state) ?? test.state,
		displayError: test.displayError ?? undefined,
		duration: test.duration,
		attempts: test.attempts.map((attempt) => ({
			state: attempt.state,
		})),
	};
}

export function mapBeforeRun(
	runId: string,
	options: CypressReporterOptions,
	details: Cypress.BeforeRunDetails
): DashboardEvent {
	const run: RunInfo = {
		id: runId,
		name: options.runName,
		runner: 'cypress',
		projectId: options.projectId,
		branch: options.branch,
		commitSha: options.commitSha,
		commitMessage: options.commitMessage,
		machineId: options.machineId,
		shardId: options.shardId,
		group: details.group,
		parallel: details.parallel,
		attributes: normalizeRunAttributes(options),
		browserName: details.browser?.name,
		browserVersion: details.browser?.version,
		osName: details.system.osName,
		osVersion: details.system.osVersion,
		runnerVersion: details.cypressVersion,
	};

	return {
		type: 'run:start',
		payload: run,
	};
}

export function mapAfterSpec(
	runId: string,
	options: CypressReporterOptions,
	result: CypressCommandLine.RunResult
): DashboardEvent {
	const spec: SpecInfo = mapSpecInfo(result);
	const tests: TestInfo[] = result.tests.map(mapTestInfo);

	return {
		type: 'spec:finish',
		payload: {
			runId,
			projectId: options.projectId,
			spec,
			tests,
		},
	};
}

export function mapAfterRun(
	runId: string,
	options: CypressReporterOptions,
	result: CypressAfterRunResult
): DashboardEvent {
	if (isFailedRunResult(result)) {
		return {
			type: 'run:finish',
			payload: {
				runId,
				projectId: options.projectId,
				failures: result.failures,
				message: result.message,
			},
		};
	}

	const run: RunInfo = {
		id: runId,
		name: options.runName,
		runner: 'cypress',
		projectId: options.projectId,
		branch: options.branch,
		commitSha: options.commitSha,
		commitMessage: options.commitMessage,
		machineId: options.machineId,
		shardId: options.shardId,
		attributes: normalizeRunAttributes(options),
		startedAt: result.startedTestsAt,
		endedAt: result.endedTestsAt,
		browserName: result.browserName,
		browserVersion: result.browserVersion,
		osName: result.osName,
		osVersion: result.osVersion,
		runnerVersion: result.cypressVersion,
	};

	const specs: SpecInfo[] = result.runs.map((runResult) => ({
		name: runResult.spec.name,
		relative: runResult.spec.relative,
		absolute: runResult.spec.absolute,
		startedAt: runResult.stats.startedAt,
		endedAt: runResult.stats.endedAt,
		duration: runResult.stats.duration,
		tests: runResult.stats.tests,
		passes: runResult.stats.passes,
		failures: runResult.stats.failures,
		pending: runResult.stats.pending,
		skipped: runResult.stats.skipped,
		suites: runResult.stats.suites,
		video: runResult.video,
		screenshots: mapScreenshots(runResult.screenshots),
	}));

	return {
		type: 'run:finish',
		payload: {
			runId,
			projectId: options.projectId,
			run,
			specs,
		},
	};
}

function normalizeRunAttributes(options: CypressReporterOptions): RunInfo['attributes'] {
	if (options.runAttributes === undefined) {
		return undefined;
	}
	
	return (options.runAttributes ?? []).map((attribute) => ({
		...attribute,
		showOnRunList: attribute.showOnRunList ?? false,
	}));
}
