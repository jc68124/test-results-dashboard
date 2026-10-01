import { Hono } from 'hono';
import type { Config, HonoEnv } from './types';
import { createAppContext } from './services/context';
import { createProjectRoutes } from './routes/projects';
import { createIngestionKeyRoutes } from './routes/ingestionKeys';
import { createRunRoutes } from './routes/runs';
import { createSpecRoutes } from './routes/specs';
import { createOverviewRoutes } from './routes/projectOverview';
import { errorHandler } from './middleware/errorHandler';

export function createApp<const TD1Binding extends string>(
	config: Config<TD1Binding>,
) {
	const app = new Hono<HonoEnv<TD1Binding>>().basePath(config.basePath ?? '/api');

	app.onError(errorHandler);

	app.use('*', async (c, next) => {
		c.set('ctx', createAppContext(c, config));

		await next();
	});

	app.route('/', createProjectRoutes<TD1Binding>());
	app.route('/', createIngestionKeyRoutes<TD1Binding>());
	app.route('/', createRunRoutes<TD1Binding>());
	app.route('/', createSpecRoutes<TD1Binding>());
	app.route('/', createOverviewRoutes<TD1Binding>());


	return app;
}