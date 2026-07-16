import { type Client, ok } from '@atcute/client';
import {
	finalizeAuthorization,
	getSession,
	OAuthUserAgent,
	type Session,
} from '@atcute/oauth-browser-client';

import { networkRetry } from '#/lib/async/retry';

import { type Clients, createOAuthClients, createPublicClients } from './clients';
import { configureModerationForAccount, configureModerationForGuest } from './moderation';
import { configureAppOAuth } from './oauth';
import type { SessionAccount } from './types';

export class InactiveAccountError extends Error {
	account: SessionAccount;
	status: string | undefined;

	constructor(account: SessionAccount, status: string | undefined) {
		super(`Account is not active${status ? `: ${status}` : ''}`);
		this.account = account;
		this.status = status;
	}
}

/**
 * refresh a resumed access token once it comes within this window of expiring. tokens with more life left are
 * resumed as-is.
 */
const TOKEN_REFRESH_LEEWAY_MS = 5 * 60_000;

/**
 * Whether `session`'s access token expires within `leewayMs` from now. A token with no recorded expiry is
 * treated as non-expiring.
 *
 * @param session the OAuth session to inspect.
 * @param leewayMs the window before expiry to report as expiring.
 * @returns true if the token expires within the window.
 */
function tokenExpiringWithin(session: Session, leewayMs: number): boolean {
	const expiresAt = session.token.expires_at;
	return expiresAt != null && expiresAt - Date.now() < leewayMs;
}

/**
 * Builds the logged-out client set, configuring guest moderation (app labelers) as a side effect.
 *
 * @returns the public client set.
 */
export function createGuestClients(): Clients {
	configureModerationForGuest();
	return createPublicClients();
}

/**
 * Fetches the signed-in account's state from its PDS via `com.atproto.server.getSession`.
 *
 * @param pds the session's PDS client.
 * @returns the account's DID and handle.
 * @throws {InactiveAccountError} if the account is deactivated or taken down.
 */
async function refreshSession(pds: Client): Promise<SessionAccount> {
	const data = await ok(pds.get('com.atproto.server.getSession', { params: {} }));
	const account: SessionAccount = { did: data.did, handle: data.handle };
	if (data.active === false || data.status) {
		throw new InactiveAccountError(account, data.status);
	}
	return account;
}

/**
 * Builds the OAuth client set for a session, validates it against the PDS, and applies moderation config.
 *
 * @param session the finalized/resumed OAuth session.
 * @returns the account and its client set.
 */
async function prepareOAuthSession(session: Session): Promise<{ account: SessionAccount; clients: Clients }> {
	const oauthAgent = new OAuthUserAgent(session);
	const clients = createOAuthClients(oauthAgent);
	const account = await refreshSession(clients.pds!);
	configureModerationForAccount(account);
	return { account, clients };
}

/**
 * Finalizes an OAuth authorization redirect into a validated, moderation-configured session.
 *
 * @param params the OAuth callback query parameters.
 * @returns the signed-in account and its client set.
 */
export async function createOAuthSession(params: URLSearchParams) {
	configureAppOAuth();
	const { session } = await finalizeAuthorization(params);
	return prepareOAuthSession(session);
}

/**
 * Resumes a stored OAuth session and validates it against the PDS.
 *
 * @param storedAccount the persisted account to resume.
 * @returns the account and its client set.
 */
export async function resumeOAuthSession(storedAccount: SessionAccount) {
	configureAppOAuth();
	const session = await networkRetry(1, () => getSession(storedAccount.did));
	return prepareOAuthSession(session);
}

/**
 * resumes a stored OAuth session without a network round trip.
 *
 * @param storedAccount the persisted account to resume.
 * @returns the client set and a validate callback that confirms the session against the server.
 * @throws {TokenRefreshError} if no stored session exists for the account.
 */
export async function optimisticOAuthSession(
	storedAccount: SessionAccount,
): Promise<{ clients: Clients; validate: () => Promise<SessionAccount> }> {
	configureAppOAuth();
	const session = await getSession(storedAccount.did, { allowStale: true });
	const oauthAgent = new OAuthUserAgent(session);
	const clients = createOAuthClients(oauthAgent);
	configureModerationForAccount(storedAccount);
	return {
		clients,
		validate: () => validateResumedSession(oauthAgent, clients.pds!),
	};
}

/**
 * validates a session resumed via {@link optimisticOAuthSession}. refreshes the access token when it is close
 * to expiry, then confirms the account is active.
 *
 * @param oauthAgent the session's active user-agent
 * @param pds the session's PDS client
 * @returns the up-to-date account
 * @throws {InactiveAccountError} if the account has been deactivated
 * @throws {TokenRefreshError} if the stored session can no longer be refreshed
 */
async function validateResumedSession(oauthAgent: OAuthUserAgent, pds: Client): Promise<SessionAccount> {
	if (tokenExpiringWithin(oauthAgent.session, TOKEN_REFRESH_LEEWAY_MS)) {
		// `noCache` forces the refresh: the leeway window is wider than the
		// library's own staleness threshold, so a plain getSession() here
		// would still hand back the soon-to-expire token.
		await oauthAgent.getSession({ noCache: true });
	}
	return refreshSession(pds);
}
