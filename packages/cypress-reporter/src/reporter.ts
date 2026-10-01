import type { DashboardEvent } from '@jc68124/test-results-dashboard-core';
import { postEvent } from './http.js';
import { mapAfterRun, mapAfterSpec, mapBeforeRun } from './mapper.js';
import type {
    CypressAfterRunResult,
    CypressReporterOptions,
} from './types.js';
import { createRunId } from './utils.js';
import { resolveGitMetadata } from './gitMetadata.js';

export class CypressReporter {
    private readonly options: CypressReporterOptions;
    private readonly runId: string;

    constructor(options: CypressReporterOptions) {
        this.options = {
            collectGitMetadata: true,
            sendRunStart: true,
            sendSpecs: true,
            sendRunFinish: true,
            ...options,
        };

        this.runId = options.runId ?? createRunId();
    }

    register(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions): void {
        const options = this.resolveOptions(config.projectRoot);

        on('before:run', async (details: Cypress.BeforeRunDetails) => {
            if (!options.sendRunStart) {
                return;
            }

            await this.safePost(
                mapBeforeRun(this.runId, options, details),
                'before:run'
            );
        });

        on('after:spec', async (_spec, result: CypressCommandLine.RunResult) => {
            if (!options.sendSpecs) {
                return;
            }

            await this.safePost(
                mapAfterSpec(this.runId, options, result),
                'after:spec'
            );
        });

        on('after:run', async (result: CypressAfterRunResult) => {
            if (!options.sendRunFinish) {
                return;
            }

            await this.safePost(
                mapAfterRun(this.runId, options, result),
                'after:run'
            );
        });

    }

    private resolveOptions(
		projectRoot: string
	): CypressReporterOptions {
		if (!this.options.collectGitMetadata) {
			return this.options;
		}

		const gitMetadata = resolveGitMetadata(
			projectRoot,
			this.options
		);

		if (this.options.debug) {
			console.log(
				'[cypress-reporter] Resolved Git metadata',
				gitMetadata
			);
		}

		return {
			...this.options,
			...gitMetadata,
		};
	}

    private async safePost(event: DashboardEvent, hook: string): Promise<void> {
        try {
            await postEvent(this.options, event);
        } catch (error) {
            if (this.options.debug) {
                console.error(`[cypress-reporter] Failed to post event from ${hook}`, error);
            }
        }
    }
}