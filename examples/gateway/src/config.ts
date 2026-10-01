import { defineConfig } from '@jc68124/auth-gateway-cf';
import { env } from 'cloudflare:workers';

export default defineConfig({
	projectName: 'test-results-dashboard-platform',
	publicBaseUrl: 'https://test.test',
	oAuth: {
		enabled: false,
	},
	passwordAuth: {
		enabled: false,
	},
	session: {
		kind: 'jwt',
		jwtSecretEnv: 'AUTH_JWT_SECRET',
	},
	userStore: {
		kind: 'postgres',
		hyperdrive: {} as Hyperdrive,
		shortStateKV: {} as KVNamespace,
	},
	propagation: {
		headerName: 'X-User',
		sigHeaderName: 'X-User-Sig',
		hmacSecretEnv: 'AUTH_HMAC_KEY',
	},
	routes: [
		{
			match: {
				path: /^\/ingest(?:\/|$)/,
			},
			auth: 'none',
			service: env.API_INGEST,
		},
		{
			match: {
				path: /^\/api(?:\/|$)/,
			},
			auth: 'none',
			service: env.API_DASHBOARD,
		},
		{
			match: {
				path: /^.*/,
			},
			auth: 'none',
			service: env.WEB,
		},
	],
});