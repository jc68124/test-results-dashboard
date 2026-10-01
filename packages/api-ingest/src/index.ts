import { createApp } from './app';
import { timeoutStaleRuns } from './jobs/timeoutStaleRuns';
import { getPrismaClient } from './services/db';
import type { Config, HonoEnv } from './types';

export function createIngestionWorker<const TD1Binding extends string>(
	cfg: Config<TD1Binding>
): ExportedHandler<HonoEnv<TD1Binding>['Bindings']> {
	const app = createApp(cfg);

	return {
		fetch(request, env, ctx) {
			return app.fetch(request, env, ctx);
		},

		async scheduled(_controller, env) {
			const d1 = env[cfg.d1Binding];
			const db = getPrismaClient(d1);

			const count = await timeoutStaleRuns(
				db,
				cfg.runTimeoutMs ?? 60 * 60 * 1000, // default to 1 hour
			);

			console.log(`Timed out ${count} stale runs`);
		},
	};
}