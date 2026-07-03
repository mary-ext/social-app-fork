import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { ActorResolver } from '@atcute/identity-resolver';
import type { ActorIdentifier } from '@atcute/lexicons';
import {
	type ClientAssertionFetcher,
	configureOAuth,
	createAuthorizationUrl,
} from '@atcute/oauth-browser-client';

import { internalClient } from '#/lib/api/internal-client';
import { timeout } from '#/lib/async/timeout';

import { OAUTH_CLIENT_ID, OAUTH_REDIRECT_URI, OAUTH_SCOPE, SLINGSHOT_SERVICE_URL } from '#/env';

export const OAUTH_CALLBACK_PATH = '/oauth/callback';
export const IS_OAUTH_CALLBACK = window.location.pathname === OAUTH_CALLBACK_PATH;

const IS_CONFIDENTIAL_CLIENT = !OAUTH_CLIENT_ID.startsWith('http://localhost');

const CLIENT_ASSERTION_ENDPOINT = `${new URL(OAUTH_CLIENT_ID).origin}/xrpc/internal.app.getClientAssertion`;

/**
 * fetches a DPoP-bound client assertion from the worker's client-assertion backend to authenticate the SPA as
 * a confidential client.
 */
const fetchClientAssertion: ClientAssertionFetcher = async ({ aud, createDpopProof }) => {
	const { client_assertion } = await ok(
		internalClient.post('internal.app.getClientAssertion', {
			headers: { dpop: await createDpopProof(CLIENT_ASSERTION_ENDPOINT) },
			input: { aud },
		}),
	);

	return {
		client_assertion,
		client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
	};
};

let configured = false;

export function configureAppOAuth() {
	if (configured) {
		return;
	}

	configureOAuth({
		fetchClientAssertion: IS_CONFIDENTIAL_CLIENT ? fetchClientAssertion : undefined,
		identityResolver: new SlingshotActorResolver(),
		metadata: {
			client_id: OAUTH_CLIENT_ID,
			redirect_uri: OAUTH_REDIRECT_URI,
		},
	});
	configured = true;
}

export async function startOAuthSignIn({ identifier }: { identifier: string }) {
	configureAppOAuth();

	const authUrl = await createAuthorizationUrl({
		target: { type: 'account', identifier: identifier as ActorIdentifier },
		scope: OAUTH_SCOPE,
	});

	await timeout(200);
	window.location.assign(authUrl);
}

class SlingshotActorResolver implements ActorResolver {
	private client = new Client({
		handler: simpleFetchHandler({ service: SLINGSHOT_SERVICE_URL }),
	});

	async resolve(actor: ActorIdentifier, options?: { signal?: AbortSignal }) {
		const resolved = await ok(
			this.client.get('blue.microcosm.identity.resolveMiniDoc', {
				params: {
					identifier: actor,
				},
				signal: options?.signal,
			}),
		);

		return {
			did: resolved.did,
			handle: resolved.handle,
			pds: new URL(resolved.pds).href,
		};
	}
}
