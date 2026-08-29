import type { Did } from '@atcute/lexicons';

import { device, persistedQueryCache } from '#/storage';

const BUSTER = import.meta.env.PUBLIC_GIT_COMMIT_HASH || 'dev';

/**
 * invalidates persisted queries between builds; call before cache reads.
 */
export const prepareQueryCache = (): void => {
	if (device.get(['queryCacheBuster']) === BUSTER) {
		return;
	}

	persistedQueryCache.removeAll();
	device.set(['queryCacheBuster'], BUSTER);
};

/**
 * clears an account's persisted queries.
 *
 * @param did account did
 */
export const clearPersistedQueryCache = (did: Did): void => {
	persistedQueryCache.removeScope([did]);
};
