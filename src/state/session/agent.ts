import { type Did as AtcuteDid } from '@atcute/lexicons';
import {
	finalizeAuthorization,
	getSession,
	OAuthUserAgent,
	type Session,
} from '@atcute/oauth-browser-client';
import {
	Agent as BaseAgent,
	type AtprotoServiceType,
	type AtpSessionData,
	type ComAtprotoServerRefreshSession,
	type Did,
} from '@atproto/api';
import { type FetchHandler } from '@atproto/api/dist/agent';
import { type SessionManager } from '@atproto/api/dist/session-manager';
import { type FetchHandlerOptions } from '@atproto/xrpc';

import { networkRetry } from '#/lib/async/retry';
import { BLUESKY_PROXY_HEADER, PUBLIC_BSKY_SERVICE } from '#/lib/constants';

import { emitNetworkConfirmed, emitNetworkLost, emitSessionDropped } from '../events';
import { configureModerationForAccount, configureModerationForGuest } from './moderation';
import { configureAppOAuth } from './oauth';
import { type SessionAccount } from './types';

export type ProxyHeaderValue = `${Did}#${AtprotoServiceType}`;

export class InactiveAccountError extends Error {
	account: SessionAccount;
	status: string | undefined;

	constructor(account: SessionAccount, status: string | undefined) {
		super(`Account is not active${status ? `: ${status}` : ''}`);
		this.account = account;
		this.status = status;
	}
}

export function createPublicAgent() {
	configureModerationForGuest(); // Side effect but only relevant for tests

	const agent = new BskyAppAgent({ service: PUBLIC_BSKY_SERVICE });
	agent.configureProxy(BLUESKY_PROXY_HEADER.get());
	return agent;
}

export async function createAgentAndFinalizeOAuth(params: URLSearchParams) {
	configureAppOAuth();
	const { session } = await finalizeAuthorization(params);
	return createPreparedOAuthAgent(session);
}

export async function createAgentAndResume(storedAccount: SessionAccount) {
	configureAppOAuth();
	const session = await networkRetry(1, () => getSession(storedAccount.did as AtcuteDid));
	return createPreparedOAuthAgent(session);
}

/**
 * Refresh a resumed access token once it comes within this window of expiring. Tokens with more life left are
 * resumed as-is, with no refresh round trip.
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
 * Resumes a stored OAuth session without a network round trip, for a fast boot. The session is not validated
 * — callers must follow up with {@link BskyAppAgent.validateResumedSession}.
 *
 * @param storedAccount the persisted account to resume.
 * @returns an agent usable immediately from the stored token.
 * @throws {TokenRefreshError} if no stored session exists for the account.
 */
export async function createOptimisticOAuthAgent(storedAccount: SessionAccount) {
	configureAppOAuth();
	const session = await getSession(storedAccount.did as AtcuteDid, { allowStale: true });
	const agent = new BskyAppAgent({
		handle: storedAccount.handle,
		oauthAgent: new OAuthUserAgent(session),
	});
	await configureOAuthAgent(agent, storedAccount);
	return agent;
}

export class Agent extends BaseAgent {
	constructor(
		proxyHeader: ProxyHeaderValue | null,
		options: SessionManager | FetchHandler | FetchHandlerOptions,
	) {
		super(options);
		if (proxyHeader) {
			this.configureProxy(proxyHeader);
		}
	}
}

async function createPreparedOAuthAgent(session: Session) {
	// handle is seeded empty; refreshSessionData() below replaces the session data.
	const agent = new BskyAppAgent({ handle: '', oauthAgent: new OAuthUserAgent(session) });
	const account = await agent.refreshSessionData();
	await configureOAuthAgent(agent, account);
	return { account, agent };
}

/**
 * Applies the configuration shared by every OAuth-backed agent: moderation setup and the network proxy
 * header.
 *
 * @param agent the agent to configure.
 * @param account the account the agent is signed in as.
 */
async function configureOAuthAgent(agent: BskyAppAgent, account: SessionAccount): Promise<void> {
	const moderation = configureModerationForAccount(agent, account);
	agent.configureProxy(BLUESKY_PROXY_HEADER.get());
	await moderation;
}

const realFetchWithEvents = withNetworkEvents(fetch);

type BskyAppAgentOptions = { handle: string; oauthAgent: OAuthUserAgent } | { service: string };

/**
 * Bridges an atcute OAuth user-agent to the {@link SessionManager} contract that `@atproto/api`'s
 * {@link BaseAgent} expects, so XRPC requests are routed through OAuth (DPoP) authentication.
 */
class OAuthSessionManager implements SessionManager {
	readonly did: string;
	readonly fetchHandler: FetchHandler;

	constructor(oauthAgent: OAuthUserAgent) {
		this.did = oauthAgent.sub;
		this.fetchHandler = createOAuthFetchHandler(oauthAgent);
	}
}

class BskyAppAgent extends BaseAgent {
	#oauthAgent: OAuthUserAgent | undefined;
	#serviceUrl: URL;
	#session: AtpSessionData | undefined;

	constructor(options: BskyAppAgentOptions) {
		if ('oauthAgent' in options) {
			super(new OAuthSessionManager(options.oauthAgent));
			this.#oauthAgent = options.oauthAgent;
			this.#serviceUrl = new URL(options.oauthAgent.session.info.aud);
			this.#session = createSessionData({
				did: options.oauthAgent.sub,
				handle: options.handle,
			});
		} else {
			super({
				service: options.service,
				fetch(...args) {
					const [input, init] = args;
					return realFetchWithEvents(input instanceof URL ? input.toString() : input, init);
				},
			});
			this.#serviceUrl = new URL(options.service);
		}
	}

	/** The signed-in account's session data, or undefined for a logged-out (public) agent. */
	get session(): AtpSessionData | undefined {
		return this.#session;
	}

	/** The PDS endpoint this agent talks to. */
	get serviceUrl(): URL {
		return this.#serviceUrl;
	}

	/** The endpoint XRPC requests are dispatched to — the same PDS as {@link BskyAppAgent.serviceUrl}. */
	get dispatchUrl(): URL {
		return this.#serviceUrl;
	}

	async resumeSession(_session: AtpSessionData): Promise<ComAtprotoServerRefreshSession.Response> {
		await this.#oauthAgent?.getSession();
		const account = await this.refreshSessionData();
		return {
			data: createSessionData({
				did: account.did,
				handle: account.handle,
			}),
			headers: {},
			success: true,
		};
	}

	async refreshSessionData(): Promise<SessionAccount> {
		const { data } = await this.com.atproto.server.getSession();
		const status = data.status;
		const account = {
			did: data.did,
			handle: data.handle,
		};

		if (data.active === false || status) {
			this.#session = undefined;
			throw new InactiveAccountError(account, status);
		}

		this.#session = createSessionData({
			active: data.active ?? true,
			did: data.did,
			handle: data.handle,
		});
		return account;
	}

	/**
	 * Validates a session resumed via {@link createOptimisticOAuthAgent}: refreshes the access token when it is
	 * within {@link TOKEN_REFRESH_LEEWAY_MS} of expiry, then confirms with the server that the account is still
	 * active.
	 *
	 * @returns the up-to-date account.
	 * @throws {InactiveAccountError} if the account has been deactivated.
	 * @throws {TokenRefreshError} if the stored session can no longer be refreshed.
	 */
	async validateResumedSession(): Promise<SessionAccount> {
		const oauthAgent = this.#oauthAgent;
		if (oauthAgent && tokenExpiringWithin(oauthAgent.session, TOKEN_REFRESH_LEEWAY_MS)) {
			// `noCache` forces the refresh: the leeway window is wider than the
			// library's own staleness threshold, so a plain getSession() here
			// would still hand back the soon-to-expire token.
			await oauthAgent.getSession({ noCache: true });
		}
		return this.refreshSessionData();
	}
}

/**
 * Builds the XRPC fetch handler for an OAuth session: routes each request through the atcute user-agent
 * (which adds DPoP auth and refreshes tokens on its own) and reports an unrecoverable session drop.
 *
 * @param oauthAgent the atcute user-agent to route requests through.
 * @returns a fetch handler for {@link OAuthSessionManager}.
 */
function createOAuthFetchHandler(oauthAgent: OAuthUserAgent): FetchHandler {
	let dropped = false;
	return withNetworkEvents(async (url: string, init: RequestInit) => {
		const response = await oauthAgent.handle(url, withReadableStreamDuplex(init));
		// `handle` refreshes tokens on its own; an invalid-token 401 coming back
		// out of it means that refresh failed and the session is unusable.
		if (!dropped && isInvalidTokenResponse(response)) {
			dropped = true;
			emitSessionDropped();
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

/**
 * Wraps a fetch-like function so each call emits a network-confirmed or network-lost event depending on
 * whether the request settled.
 */
function withNetworkEvents<Args extends unknown[]>(
	fetchFn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
	return async (...args) => {
		try {
			const response = await fetchFn(...args);
			emitNetworkConfirmed();
			return response;
		} catch (e) {
			emitNetworkLost();
			throw e;
		}
	};
}

function createSessionData({
	active = true,
	did,
	handle,
}: {
	active?: boolean;
	did: string;
	handle: string;
}): AtpSessionData {
	return {
		// OAuth access/refresh tokens live in the atcute user-agent; these JWT
		// fields exist only to satisfy the AtpSessionData shape and are unused.
		accessJwt: '',
		active,
		did,
		handle,
		refreshJwt: '',
	};
}

export type { BskyAppAgent };
