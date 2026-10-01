import type { Config } from './types';

export function defineConfig<const TD1Binding extends string>(
	config: Config<TD1Binding>,
): Config<TD1Binding> {
	return config;
}