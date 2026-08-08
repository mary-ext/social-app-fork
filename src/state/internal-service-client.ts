import type { Client } from '@atcute/client';

import { internalClient } from '#/lib/api/internal-client';

import { getClients } from '#/state/session';

import { INTERNAL_PROXY_AUDIENCE } from '#/env';

/**
 * returns an authenticated client for internal services.
 *
 * @returns the internal service client
 * @throws when no account is signed in
 */
export const getInternalServiceClient = (): Client => {
	if (import.meta.env.DEV) {
		return internalClient;
	}

	const { pds } = getClients();
	if (pds === null) {
		throw new Error(`cannot call internal services while logged out`);
	}

	return pds.clone({ proxy: INTERNAL_PROXY_AUDIENCE });
};
