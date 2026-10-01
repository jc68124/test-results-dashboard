import { createApp } from './app';
import type { Config, HonoEnv } from './types';

export function createAPIWorker<const TD1Binding extends string>(
	config: Config<TD1Binding>,
): ExportedHandler<HonoEnv<TD1Binding>['Bindings']> {
	const app = createApp(config);

	return {
		fetch(request, env, ctx) {
			return app.fetch(request, env, ctx);
		},
	};
}