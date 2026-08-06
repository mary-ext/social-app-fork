import { Client, simpleFetchHandler } from '@atcute/client';

import { PUBLIC_BSKY_SERVICE } from '#/lib/constants/services';

import { APPVIEW_PROXY_AUDIENCE, CHAT_PROXY_AUDIENCE } from '#/env';

import { acceptLabelersHeaderValue } from './labelers';
import { createOAuthFetchHandler, type FetchHandler, withNetworkEvents } from './network';
import type { OAuthUserAgent } from './oauth';

/** XRPC clients used by the app. */
export type Clients = { appview: Client; chat: Client | null; pds: Client | null; pdsUrl: string | null };

function withLabelersHeader(handler: FetchHandler): FetchHandler {
	return (url, init) => {
		const headers = new Headers(init.headers);
		if (!headers.has('atproto-accept-labelers')) {
			headers.set('atproto-accept-labelers', acceptLabelersHeaderValue());
		}
		return handler(url, { ...init, headers });
	};
}

/** builds clients for a logged-out session. */
export function createPublicClients(): Clients {
	const handler = withLabelersHeader(withNetworkEvents(simpleFetchHandler({ service: PUBLIC_BSKY_SERVICE })));
	return { appview: new Client({ handler }), chat: null, pds: null, pdsUrl: null };
}

/** builds clients for an OAuth session. */
export function createOAuthClients(oauthAgent: OAuthUserAgent): Clients {
	const handler = createOAuthFetchHandler(oauthAgent);
	// only appview and chat return labeler-filtered views.
	const labeled = withLabelersHeader(handler);
	return {
		appview: new Client({ handler: labeled, proxy: APPVIEW_PROXY_AUDIENCE }),
		chat: new Client({ handler: labeled, proxy: CHAT_PROXY_AUDIENCE }),
		pds: new Client({ handler }),
		pdsUrl: oauthAgent.session.info.aud,
	};
}
