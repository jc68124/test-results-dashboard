import type { PrismaClient } from '@jc68124/test-results-dashboard-db';

export type Config<TD1Binding extends string> = {
	basePath?: string;
	d1Binding: TD1Binding;
};

export type AppCtx<TD1Binding extends string> = {
	cfg: Config<TD1Binding>;
	db: PrismaClient;
};

export type HonoEnv<TD1Binding extends string> = {
	Bindings: Record<TD1Binding, D1Database>;
	Variables: {
		ctx: AppCtx<TD1Binding>;
	};
};