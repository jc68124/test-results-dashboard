import { getPrismaClient } from './db';
import type { AppCtx, Config, HonoEnv } from '../types';
import { Context } from 'hono';

export function createAppContext<const TD1Binding extends string>(
	c: Context<HonoEnv<TD1Binding>>,
	cfg: Config<TD1Binding>,
): AppCtx<TD1Binding> {
	const d1 = c.env[cfg.d1Binding];

	if (!d1) {
		throw new Error(
			`D1 binding "${cfg.d1Binding}" is not available`,
		);
	}

	return {
		cfg,
		db: getPrismaClient(d1),
	};
}