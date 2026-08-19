export * from '@atcute/oauth-browser-client';

import { ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';
import {
	type ClientAssertionFetcher,
	configureOAuth,
	createAuthorizationUrl,
} from '@atcute/oauth-browser-client';

import { internalClient } from '#/lib/api/internal-client';
import { resolveMiniDoc } from '#/lib/api/slingshot-client';
import { sleep } from '#/lib/utils/sleep';

import { OAUTH_CLIENT_ID, OAUTH_REDIRECT_URI, OAUTH_SCOPE } from '#/env';

export const OAUTH_CALLBACK_PATH = '/oauth/callback';
export const IS_OAUTH_CALLBACK = window.location.pathname === OAUTH_CALLBACK_PATH;

const IS_CONFIDENTIAL_CLIENT = !OAUTH_CLIENT_ID.startsWith('http://localhost');

const CLIENT_ASSERTION_ENDPOINT = `${new URL(OAUTH_CLIENT_ID).origin}/xrpc/internal.app.getClientAssertion`;

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

configureOAuth({
	fetchClientAssertion: IS_CONFIDENTIAL_CLIENT ? fetchClientAssertion : undefined,
	identityResolver: {
		resolve(actor, options) {
			return resolveMiniDoc(actor, options?.signal);
		},
	},
	metadata: {
		client_id: OAUTH_CLIENT_ID,
		redirect_uri: OAUTH_REDIRECT_URI,
	},
});

export async function startOAuthSignIn({ identifier }: { identifier: ActorIdentifier }) {
	const authUrl = await createAuthorizationUrl({
		target: { type: 'account', identifier },
		scope: OAUTH_SCOPE,
	});

	await sleep(200);
	window.location.assign(authUrl);
}
