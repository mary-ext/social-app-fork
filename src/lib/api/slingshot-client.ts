import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';

import { SLINGSHOT_SERVICE_URL } from '#/env';

/** unauthenticated Microcosm Slingshot XRPC client. */
export const slingshotClient = new Client({
	handler: simpleFetchHandler({ service: SLINGSHOT_SERVICE_URL }),
});

/**
 * resolves an actor's identity.
 *
 * @param identifier a DID or handle
 * @param signal aborts the request
 * @returns the actor's DID, handle, and PDS origin with a trailing slash
 */
export async function resolveMiniDoc(identifier: ActorIdentifier, signal?: AbortSignal) {
	const { did, handle, pds } = await ok(
		slingshotClient.get('blue.microcosm.identity.resolveMiniDoc', {
			signal,
			params: { identifier },
		}),
	);

	return { did, handle, pds: new URL(pds).href };
}
