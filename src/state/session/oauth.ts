import { Client, ok, simpleFetchHandler } from '@atcute/client';
import { type ActorResolver } from '@atcute/identity-resolver';
import { type ActorIdentifier } from '@atcute/lexicons';
import type {} from '@atcute/microcosm';
import { configureOAuth, createAuthorizationUrl } from '@atcute/oauth-browser-client';

import { timeout } from '#/lib/async/timeout';

import { OAUTH_CLIENT_ID, OAUTH_REDIRECT_URI, OAUTH_SCOPE, SLINGSHOT_SERVICE_URL } from '#/env';

export const OAUTH_CALLBACK_PATH = '/oauth/callback';
export const IS_OAUTH_CALLBACK = window.location.pathname === OAUTH_CALLBACK_PATH;

let configured = false;

export function configureAppOAuth() {
	if (configured) {
		return;
	}

	configureOAuth({
		metadata: {
			client_id: OAUTH_CLIENT_ID,
			redirect_uri: OAUTH_REDIRECT_URI,
		},
		identityResolver: new SlingshotActorResolver(),
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
