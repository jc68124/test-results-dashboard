import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
	...nextVitals,
	...nextTypeScript,
	{
		rules: {
			'@next/next/no-img-element': 'off',
		},
	},
	globalIgnores(['.next/**', '.open-next/**', 'next-env.d.ts', 'worker-configuration.d.ts']),
]);
