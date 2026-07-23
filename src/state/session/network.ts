import { networkConfirmed, networkLost, sessionDropped } from '#/state/events';

import type { OAuthUserAgent } from './oauth';

/**
 * A fetch handler shape compatible with both `@atproto/api`'s session manager and `@atcute/client`'s `Client`
 * — both call it with a URL/pathname and a `RequestInit`.
 */
export type FetchHandler = (this: void, url: string, init: RequestInit) => Promise<Response>;

/**
 * Wraps a fetch-like function so each call emits a network-confirmed or network-lost event depending on
 * whether the request settled.
 *
 * @param fetchFn the fetch-like function to instrument.
 * @returns the instrumented function.
 */
export function withNetworkEvents<Args extends unknown[]>(
	fetchFn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
	return async (...args) => {
		try {
			const response = await fetchFn(...args);
			networkConfirmed.emit();
			return response;
		} catch (e) {
			networkLost.emit();
			throw e;
		}
	};
}

/**
 * builds the XRPC fetch handler for an OAuth session, routing requests through the agent, adding
 * network-event instrumentation, and reporting session drops.
 *
 * @param oauthAgent atcute user-agent to route requests through
 * @returns fetch handler for @atcute/client
 */
export function createOAuthFetchHandler(oauthAgent: OAuthUserAgent): FetchHandler {
	let dropped = false;
	return withNetworkEvents(async (url: string, init: RequestInit) => {
		const response = await oauthAgent.handle(url, withReadableStreamDuplex(init));
		// `handle` refreshes tokens on its own; an invalid-token 401 coming back
		// out of it means that refresh failed and the session is unusable.
		if (!dropped && isInvalidTokenResponse(response)) {
			dropped = true;
			sessionDropped.emit();
		}
		return response;
	});
}

type ReadableStreamRequestInit = RequestInit & { duplex?: 'half' };

function withReadableStreamDuplex(init: RequestInit | undefined): RequestInit | undefined {
	if (typeof ReadableStream === 'undefined' || !(init?.body instanceof ReadableStream)) {
		return init;
	}

	const nextInit: ReadableStreamRequestInit = {
		...init,
		duplex: 'half',
	};

	return nextInit;
}

function isInvalidTokenResponse(response: Response): boolean {
	if (response.status !== 401) {
		return false;
	}
	const auth = response.headers.get('www-authenticate');
	return (
		auth != null &&
		(auth.startsWith('Bearer ') || auth.startsWith('DPoP ')) &&
		auth.includes('error="invalid_token"')
	);
}
