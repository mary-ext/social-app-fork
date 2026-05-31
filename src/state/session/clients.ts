import { Client, simpleFetchHandler } from '@atcute/client';
import { type OAuthUserAgent } from '@atcute/oauth-browser-client';

import { PUBLIC_BSKY_SERVICE } from '#/lib/constants';

import { APPVIEW_PROXY_AUDIENCE, CHAT_PROXY_AUDIENCE } from '#/env';

import { acceptLabelersHeaderValue } from './labelers';
import { createOAuthFetchHandler, type FetchHandler, withNetworkEvents } from './network';

/**
 * The XRPC clients backing every network call. `appview` reaches the Bluesky AppView; `pds` reaches the
 * signed-in user's PDS; `chat` reaches the Bluesky chat service via the PDS. `pdsUrl` is the PDS service URL
 * the video pipeline needs (the clients don't expose it). `pds`, `chat`, and `pdsUrl` are `null` while logged
 * out (no session, no PDS).
 */
export type Clients = { appview: Client; chat: Client | null; pds: Client | null; pdsUrl: string | null };

/**
 * Wraps a fetch handler so its client's requests carry the `atproto-accept-labelers` header. The value is
 * read fresh on every call so it tracks labeler-subscription changes without rebuilding the client.
 *
 * @param handler the handler to wrap.
 * @returns a handler that injects the labelers header when one is not already present.
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
 * Builds the logged-in client set. All three clients share the OAuth handler targeting the user's PDS;
 * `appview` and `chat` carry the `#bsky_appview` / `#bsky_chat` proxy headers so the PDS forwards to the
 * respective services, plus the `atproto-accept-labelers` header so labeler-filtered views honor the user's
 * subscriptions.
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
