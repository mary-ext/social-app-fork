import { Client, simpleFetchHandler } from '@atcute/client';

import { PUBLIC_BSKY_SERVICE } from '#/lib/constants';

import { APPVIEW_PROXY_AUDIENCE, CHAT_PROXY_AUDIENCE } from '#/env';

import { acceptLabelersHeaderValue } from './labelers';
import { createOAuthFetchHandler, type FetchHandler, withNetworkEvents } from './network';
import type { OAuthUserAgent } from './oauth';

/**
 * xrpc clients backing every network call.
 *
 * @param appview reaches the Bluesky AppView
 * @param pds reaches the signed-in user's PDS, or null if logged out
 * @param chat reaches the Bluesky chat service via the PDS, or null if logged out
 * @param pdsUrl PDS service URL needed for the video pipeline, or null if logged out
 */
export type Clients = { appview: Client; chat: Client | null; pds: Client | null; pdsUrl: string | null };

/**
 * wraps a fetch handler so client requests carry the `atproto-accept-labelers` header.
 *
 * @param handler the handler to wrap
 * @returns a handler that injects the labelers header if not already present
 */
function withLabelersHeader(handler: FetchHandler): FetchHandler {
	return (url, init) => {
		const headers = new Headers(init.headers);
		if (!headers.has('atproto-accept-labelers')) {
			headers.set('atproto-accept-labelers', acceptLabelersHeaderValue());
		}
		return handler(url, { ...init, headers });
	};
}

/**
 * Builds the logged-out client set. `public.api.bsky.app` is itself the AppView, so `appview` needs no proxy;
 * there is no session, so `pds` and `chat` are `null`.
 *
 * @returns clients with a working `appview` and `null` `pds` / `chat`.
 */
export function createPublicClients(): Clients {
	const handler = withLabelersHeader(withNetworkEvents(simpleFetchHandler({ service: PUBLIC_BSKY_SERVICE })));
	return { appview: new Client({ handler }), chat: null, pds: null, pdsUrl: null };
}

/**
 * builds the logged-in client set where all three clients share the OAuth handler targeting the user's PDS.
 *
 * @param oauthAgent the session's atcute user-agent.
 * @returns clients with a working `appview`, `pds`, and `chat`.
 */
export function createOAuthClients(oauthAgent: OAuthUserAgent): Clients {
	const handler = createOAuthFetchHandler(oauthAgent);
	// appview and chat both hydrate labeler-filtered views, so both advertise the user's labelers; the
	// pds talks to the repo directly and needs no labeler header.
	const labeled = withLabelersHeader(handler);
	return {
		appview: new Client({ handler: labeled, proxy: APPVIEW_PROXY_AUDIENCE }),
		chat: new Client({ handler: labeled, proxy: CHAT_PROXY_AUDIENCE }),
		pds: new Client({ handler }),
		pdsUrl: oauthAgent.session.info.aud,
	};
}
