import { env } from 'cloudflare:workers';
import { createProxy } from '@jc68124/lightweight-proxy-cf';

export default createProxy({
  routes: [
    {
      match: { prefix: '/ingest' },
      service: env.API_INGEST,
    },
    {
      match: { prefix: '/api' },
      service: env.API_DASHBOARD,
    },
  ],
  fallback: env.WEB,
});