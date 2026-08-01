import { networkConfirmed, networkLost, sessionDropped } from '#/state/events';

import type { OAuthUserAgent } from './oauth';

/** fetch handler shape shared by the OAuth agent and `@atcute/client`. */
export type FetchHandler = (this: void, url: string, init: RequestInit) => Promise<Response>;

/** emits network state events around a fetch-like function. */
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

/** builds the authenticated XRPC fetch handler and reports token failures. */
export function createOAuthFetchHandler(oauthAgent: OAuthUserAgent): FetchHandler {
	let dropped = false;
	return withNetworkEvents(async (url: string, init: RequestInit) => {
		const response = await oauthAgent.handle(url, withReadableStreamDuplex(init));
		// an invalid-token 401 means token refresh failed.
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
