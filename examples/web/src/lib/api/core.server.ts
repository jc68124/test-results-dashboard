import 'server-only';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { ApiFetcher } from './core';

export const serviceBindingFetcher: ApiFetcher = (path, init) => {
	const { env } = getCloudflareContext();
	const url = new URL(path, 'https://api.internal');

	return env.API.fetch(new Request(url, init));
};
