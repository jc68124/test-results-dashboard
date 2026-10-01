import 'server-only';

import { serviceBindingFetcher } from './core.server';
import {
	createIngestionKey as createIngestionKeyBase,
	deleteIngestionKey as deleteIngestionKeyBase,
	getProjectIngestionKeys as getProjectIngestionKeysBase,
	revokeIngestionKey as revokeIngestionKeyBase,
} from './ingestionKeys';

export function getProjectIngestionKeys(publicId: string) {
	return getProjectIngestionKeysBase(publicId, {
		apiFetcher: serviceBindingFetcher,
	});
}

export function createIngestionKey(publicId: string, name: string, expiresAt: Date | null) {
	return createIngestionKeyBase(publicId, name, expiresAt, {
		apiFetcher: serviceBindingFetcher,
	});
}

export function revokeIngestionKey(publicId: string, keyPublicId: string) {
	return revokeIngestionKeyBase(publicId, keyPublicId, {
		apiFetcher: serviceBindingFetcher,
	});
}

export function deleteIngestionKey(publicId: string, keyPublicId: string) {
	return deleteIngestionKeyBase(publicId, keyPublicId, {
		apiFetcher: serviceBindingFetcher,
	});
}
