import { Hono } from 'hono';
import type { Config, HonoEnv } from './types';
import { createIngestRoutes } from './routes/ingest';
import { createAppContext } from './services/context';

export function createApp<const TD1Binding extends string>(
	config: Config<TD1Binding>
) {
	const app = new Hono<HonoEnv<TD1Binding>>().basePath(config.basePath ?? '/ingest');

	app.use('*', async (c, next) => {
		c.set('ctx', createAppContext(c, config));

		await next();
	});

	app.route('/', createIngestRoutes<TD1Binding>());

	return app;
}