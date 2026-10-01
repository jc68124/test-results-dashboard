import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export interface GitMetadata {
	branch?: string;
	commitSha?: string;
	commitMessage?: string;
}

interface GitHubEventMetadata {
	branch?: string;
	commitSha?: string;
	commitMessage?: string;
}

const BRANCH_MAX_LENGTH = 255;
const COMMIT_SHA_MAX_LENGTH = 128;
const COMMIT_MESSAGE_MAX_LENGTH = 4_096;
const GIT_OBJECT_ID_PATTERN = /^[0-9a-f]{7,64}$/i;

export function resolveGitMetadata(
	projectRoot: string,
	overrides: GitMetadata = {}
): GitMetadata {
	const githubEvent = getGitHubEventMetadata();

	const branch =
		normalizeBranch(overrides.branch) ??
		getEnvironmentBranch(githubEvent) ??
		normalizeBranch(
			runGit(projectRoot, ['branch', '--show-current'])
		);

	const commitSha =
		normalizeValue(
			overrides.commitSha,
			COMMIT_SHA_MAX_LENGTH
		) ??
		getEnvironmentCommitSha(githubEvent) ??
		normalizeCommitSha(
			runGit(projectRoot, ['rev-parse', 'HEAD'])
		);

	const commitMessage =
		normalizeValue(
			overrides.commitMessage,
			COMMIT_MESSAGE_MAX_LENGTH
		) ??
		getEnvironmentCommitMessage(commitSha, githubEvent) ??
		getGitCommitMessage(projectRoot, commitSha);

	return {
		branch,
		commitSha,
		commitMessage,
	};
}

function getEnvironmentBranch(
	githubEvent: GitHubEventMetadata
): string | undefined {
	return getFirstBranch(
		// Explicit Cypress-compatible value
		process.env.COMMIT_INFO_BRANCH,

		// Azure DevOps
		process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH,
		process.env.BUILD_SOURCEBRANCH,

		// GitHub Actions
		process.env.GITHUB_HEAD_REF,
		githubEvent.branch,
		process.env.GITHUB_REF_TYPE === 'branch'
			? process.env.GITHUB_REF_NAME
			: undefined,

		// GitLab
		process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME,
		process.env.CI_COMMIT_REF_NAME,

		// CircleCI
		process.env.CIRCLE_BRANCH,

		// Bitbucket Pipelines
		process.env.BITBUCKET_BRANCH,

		// Jenkins
		process.env.CHANGE_BRANCH,
		process.env.BRANCH_NAME
	);
}

function getEnvironmentCommitSha(
	githubEvent: GitHubEventMetadata
): string | undefined {
	const commitInfoSha = normalizeValue(
		process.env.COMMIT_INFO_SHA,
		COMMIT_SHA_MAX_LENGTH
	);

	if (commitInfoSha) {
		return commitInfoSha;
	}

	return getFirstCommitSha(
		// Azure DevOps
		// Build.SourceVersion is the merge commit during PR builds,
		// so prefer the source commit when available.
		process.env.SYSTEM_PULLREQUEST_SOURCECOMMITID,
		process.env.BUILD_SOURCEVERSION,

		// GitHub Actions
		// GITHUB_SHA is the merge commit during pull_request workflows,
		// so prefer pull_request.head.sha from the event payload.
		githubEvent.commitSha,
		process.env.GITHUB_SHA,

		// GitLab
		process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_SHA,
		process.env.CI_COMMIT_SHA,

		// CircleCI
		process.env.CIRCLE_SHA1,

		// Bitbucket Pipelines
		process.env.BITBUCKET_COMMIT,

		// Jenkins
		process.env.GIT_COMMIT
	);
}

function getEnvironmentCommitMessage(
	commitSha: string | undefined,
	githubEvent: GitHubEventMetadata
): string | undefined {
	const commitInfoSha = normalizeValue(
		process.env.COMMIT_INFO_SHA,
		COMMIT_SHA_MAX_LENGTH
	);

	const commitInfoMessage = normalizeValue(
		process.env.COMMIT_INFO_MESSAGE,
		COMMIT_MESSAGE_MAX_LENGTH
	);

	/*
	 * Allow COMMIT_INFO_MESSAGE without COMMIT_INFO_SHA because it is an
	 * explicit user-provided value. If both are provided, only use the
	 * message when it belongs to the selected commit.
	 */
	if (
		commitInfoMessage &&
		(
			!commitSha ||
			!commitInfoSha ||
			commitInfoSha === commitSha
		)
	) {
		return commitInfoMessage;
	}

	const candidates = [
		{
			// Azure's message belongs to BUILD_SOURCEVERSION, which can
			// differ from SYSTEM_PULLREQUEST_SOURCECOMMITID in PR builds.
			commitSha: normalizeCommitSha(
				process.env.BUILD_SOURCEVERSION
			),
			commitMessage: normalizeValue(
				process.env.BUILD_SOURCEVERSIONMESSAGE,
				COMMIT_MESSAGE_MAX_LENGTH
			),
		},
		{
			commitSha: normalizeCommitSha(
				githubEvent.commitSha
			),
			commitMessage: normalizeValue(
				githubEvent.commitMessage,
				COMMIT_MESSAGE_MAX_LENGTH
			),
		},
		{
			// CI_COMMIT_MESSAGE belongs to CI_COMMIT_SHA, not necessarily
			// CI_MERGE_REQUEST_SOURCE_BRANCH_SHA.
			commitSha: normalizeCommitSha(
				process.env.CI_COMMIT_SHA
			),
			commitMessage: normalizeValue(
				process.env.CI_COMMIT_MESSAGE,
				COMMIT_MESSAGE_MAX_LENGTH
			),
		},
	];

	for (const candidate of candidates) {
		if (!candidate.commitMessage) {
			continue;
		}

		if (
			!commitSha ||
			candidate.commitSha === commitSha
		) {
			return candidate.commitMessage;
		}
	}

	return undefined;
}

function getGitHubEventMetadata(): GitHubEventMetadata {
	const eventPath = process.env.GITHUB_EVENT_PATH?.trim();

	if (!eventPath) {
		return {};
	}

	try {
		const event: unknown = JSON.parse(
			readFileSync(eventPath, 'utf8')
		);

		if (!isRecord(event)) {
			return {};
		}

		const pullRequest = event.pull_request;

		if (isRecord(pullRequest)) {
			const head = pullRequest.head;

			if (isRecord(head)) {
				return {
					branch: getString(head, 'ref'),
					commitSha: getString(head, 'sha'),
				};
			}
		}

		const headCommit = event.head_commit;

		const headCommitSha = isRecord(headCommit)
			? getString(headCommit, 'id')
			: undefined;

		const headCommitMessage = isRecord(headCommit)
			? getString(headCommit, 'message')
			: undefined;

		const ref = getString(event, 'ref');

		return {
			branch: ref?.startsWith('refs/heads/')
				? ref
				: undefined,
			commitSha:
				headCommitSha ??
				getString(event, 'after'),
			commitMessage: headCommitMessage,
		};
	} catch {
		return {};
	}
}

function getGitCommitMessage(
	projectRoot: string,
	commitSha: string | undefined
): string | undefined {
	/*
	 * Explicit metadata may contain any value accepted by the public
	 * schema, but only a valid Git object ID should be passed to Git.
	 */
	if (!commitSha || !GIT_OBJECT_ID_PATTERN.test(commitSha)) {
		return undefined;
	}

	return normalizeValue(
		runGit(projectRoot, [
			'show',
			'-s',
			'--format=%B',
			commitSha,
		]),
		COMMIT_MESSAGE_MAX_LENGTH
	);
}

function getFirstBranch(
	...values: Array<string | undefined>
): string | undefined {
	for (const value of values) {
		const branch = normalizeBranch(value);

		if (branch) {
			return branch;
		}
	}

	return undefined;
}

function getFirstCommitSha(
	...values: Array<string | undefined>
): string | undefined {
	for (const value of values) {
		const commitSha = normalizeCommitSha(value);

		if (commitSha) {
			return commitSha;
		}
	}

	return undefined;
}

function runGit(
	projectRoot: string,
	args: string[]
): string | undefined {
	try {
		const value = execFileSync('git', args, {
			cwd: projectRoot,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		});

		return value.trim() || undefined;
	} catch {
		return undefined;
	}
}

function normalizeBranch(
	value: string | undefined
): string | undefined {
	const trimmed = value?.trim();

	if (!trimmed) {
		return undefined;
	}

	/*
	 * Remove ref prefixes before truncating so that the prefix does not
	 * consume part of the branch-name length allowance.
	 */
	const normalized = trimmed
		.replace(/^refs\/heads\//, '')
		.replace(/^refs\/remotes\/origin\//, '')
		.replace(/^origin\//, '')
		.slice(0, BRANCH_MAX_LENGTH);

	if (!normalized || normalized === 'HEAD') {
		return undefined;
	}

	return normalized;
}

function normalizeCommitSha(
	value: string | undefined
): string | undefined {
	const normalized = normalizeValue(
		value,
		COMMIT_SHA_MAX_LENGTH
	);

	if (
		!normalized ||
		!GIT_OBJECT_ID_PATTERN.test(normalized)
	) {
		return undefined;
	}

	return normalized.toLowerCase();
}

function normalizeValue(
	value: string | undefined,
	maxLength: number
): string | undefined {
	const normalized = value?.trim();

	if (!normalized) {
		return undefined;
	}

	return normalized.slice(0, maxLength);
}

function isRecord(
	value: unknown
): value is Record<string, unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value)
	);
}

function getString(
	record: Record<string, unknown>,
	key: string
): string | undefined {
	const value = record[key];

	return typeof value === 'string'
		? value
		: undefined;
}