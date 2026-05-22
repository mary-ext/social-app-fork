import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type Did as AtcuteDid } from '@atcute/lexicons';
import { deleteStoredSession, TokenRefreshError } from '@atcute/oauth-browser-client';

import { clearPersistedQueryStorage } from '#/lib/persisted-query-storage';

import { listenSessionDropped } from '#/state/events';
import * as persisted from '#/state/persisted';
import { type SessionAccount, type SessionApiContext, type SessionStateContext } from '#/state/session/types';
import { useCloseAllActiveElements } from '#/state/util';

import { logger } from '#/logger';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';

import { auth, type AuthSession } from '#/storage';

import {
	type BskyAppAgent,
	createAgentAndFinalizeOAuth,
	createAgentAndResume,
	createOptimisticOAuthAgent,
	createPublicAgent,
	InactiveAccountError,
} from './agent';
import { type Clients, createPublicClients } from './clients';
import { IS_OAUTH_CALLBACK, startOAuthSignIn } from './oauth';

export type { SessionAccount } from '#/state/session/types';

/**
 * The session is immutable for a page's lifetime: it's resolved once at boot, and every account change
 * (switch, sign-out, cross-tab change) reloads the page. Removing a non-current account is the sole live
 * mutation.
 */

// `auth` storage notifies in-process listeners on every write. A write made by
// this tab is already reflected locally, so the cross-tab listener latches on
// this flag to react only to writes from *other* tabs.
let isWritingSession = false;

function writeSession(next: AuthSession) {
	isWritingSession = true;
	try {
		auth.set(['session'], next);
	} finally {
		isWritingSession = false;
	}
}

/** Returns `accounts` with `account` moved to the front (most recent first). */
function prependAccount(accounts: SessionAccount[], account: SessionAccount): SessionAccount[] {
	return [account, ...accounts.filter((a) => a.did !== account.did)];
}

/** Persists a logged-out session, clears the given dids' caches, and reloads at the root route. */
function signOut({ accounts, clearDids = [] }: { accounts: SessionAccount[]; clearDids?: string[] }) {
	for (const did of clearDids) {
		void clearPersistedQueryStorage(did);
	}
	writeSession({ accounts, currentAccountDid: undefined });
	history.pushState(null, '', '/');
	window.location.reload();
}

/** Extracts a loggable message from an unknown thrown value. */
function errorMessage(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}

/**
 * Boot lifecycle of the persisted session: `resuming` builds the agent from the stored token, `validating`
 * keeps that agent live while the session is checked against the server, `failed` means the stored session
 * was rejected, and `idle` covers both "no stored session" and a fully-settled resume.
 */
type SessionBootStatus = 'failed' | 'idle' | 'resuming' | 'validating';

const StateContext = createContext<SessionStateContext>({
	accounts: [],
	currentAccount: undefined,
	hasSession: false,
	isSessionResuming: false,
	sessionResumeFailed: false,
});
StateContext.displayName = 'SessionStateContext';

const AgentContext = createContext<BskyAppAgent | null>(null);
AgentContext.displayName = 'SessionAgentContext';

const ClientsContext = createContext<Clients | null>(null);
ClientsContext.displayName = 'SessionClientsContext';

// Module-level mirror of the current clients, for the rare non-React caller.
// Kept in sync by an effect in `Provider` below.
let currentClients: Clients | null = null;

const ApiContext = createContext<SessionApiContext>({
	completeOAuthCallback: async () => {},
	login: async () => {},
	logoutCurrentAccount: () => {},
	logoutEveryAccount: () => {},
	removeAccount: () => {},
	switchAccount: async () => {},
});
ApiContext.displayName = 'SessionApiContext';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const boot = useMemo(() => readPersistedSession(), []);
	const bootAccount = IS_OAUTH_CALLBACK
		? undefined
		: boot.accounts.find((a) => a.did === boot.currentAccountDid);
	const [accounts, setAccounts] = useState<SessionAccount[]>(boot.accounts);
	const [agent, setAgent] = useState<BskyAppAgent>(createPublicAgent);
	const [clients, setClients] = useState<Clients>(createPublicClients);
	const [currentDid, setCurrentDid] = useState<string | undefined>(undefined);
	const [status, setStatus] = useState<SessionBootStatus>(() => (bootAccount ? 'resuming' : 'idle'));

	// Boot: resume the persisted current account exactly once. This is the only
	// path that resumes a session — every later account change reloads the page.
	// The agent is built from the stored token with no network round trip, so the
	// app renders immediately; the session is then validated in the background.
	useEffect(() => {
		if (!bootAccount) {
			return;
		}
		let cancelled = false;
		// Latches the one-shot exit from resuming/validating, so a dropped session
		// and a rejected validation can't both act on the same boot.
		let settled = false;

		// The stored session is unusable: persist a logged-out session so the next
		// boot doesn't retry it, and drop back to a guest agent in place — no
		// reload, unlike `signOut`.
		const failResume = () => {
			if (settled) {
				return;
			}
			settled = true;
			writeSession({ accounts: boot.accounts, currentAccountDid: undefined });
			setAgent(createPublicAgent());
			setClients(createPublicClients());
			setCurrentDid(undefined);
			setStatus('failed');
		};

		const resume = async () => {
			let resumed: { agent: BskyAppAgent; clients: Clients };
			try {
				resumed = await createOptimisticOAuthAgent(bootAccount);
			} catch (e) {
				if (cancelled) {
					return;
				}
				if (!(e instanceof TokenRefreshError)) {
					logger.error('session: boot resume failed', { message: errorMessage(e) });
				}
				failResume();
				return;
			}
			if (cancelled) {
				return;
			}
			// The agent is usable from the stored token — render now and validate
			// the session against the server in the background.
			setAgent(resumed.agent);
			setClients(resumed.clients);
			setCurrentDid(bootAccount.did);
			setStatus('validating');

			// A session dropped by live traffic during validation fails the resume;
			// the global dropped-session listener stays off until this settles.
			const unlistenDropped = listenSessionDropped(() => {
				if (!cancelled) {
					failResume();
				}
			});
			try {
				await resumed.agent.validateResumedSession();
			} catch (e) {
				if (cancelled) {
					return;
				}
				if (e instanceof TokenRefreshError || e instanceof InactiveAccountError) {
					failResume();
				} else {
					// A transient failure (e.g. network) — keep the optimistic session;
					// live traffic will surface a genuine failure.
					logger.error('session: boot validation failed', { message: errorMessage(e) });
				}
			} finally {
				unlistenDropped();
			}
			if (!cancelled && !settled) {
				settled = true;
				setStatus('idle');
			}
		};

		void resume();
		return () => {
			cancelled = true;
		};
	}, [boot, bootAccount]);

	// Another tab changed the session. Reload only when the change affects the
	// account this tab is signed in as — it's no longer the current account, or
	// it was removed. Edits to other accounts are left alone.
	useEffect(() => {
		const sub = auth.addOnValueChangedListener(['session'], () => {
			if (isWritingSession) {
				return;
			}
			const next = auth.get(['session']);
			const accountChanged = next?.currentAccountDid !== currentDid;
			const accountRemoved =
				currentDid !== undefined && !(next?.accounts.some((a) => a.did === currentDid) ?? false);
			if (accountChanged || accountRemoved) {
				window.location.reload();
			}
		});
		return () => sub.remove();
	}, [currentDid]);

	// A live session dropped mid-use. Reload so the boot resume re-resolves it
	// (and surfaces the failure as a logged-out state). Held off while the boot
	// resume is still settling, where it handles dropped sessions itself.
	useEffect(() => {
		if (status === 'resuming' || status === 'validating') {
			return;
		}
		return listenSessionDropped(() => window.location.reload());
	}, [status]);

	const login = useCallback<SessionApiContext['login']>(async ({ identifier }) => {
		await startOAuthSignIn({ identifier });
	}, []);

	const completeOAuthCallback = useCallback<SessionApiContext['completeOAuthCallback']>(
		async (params) => {
			const { account } = await createAgentAndFinalizeOAuth(params);
			writeSession({
				accounts: prependAccount(accounts, account),
				currentAccountDid: account.did,
			});
		},
		[accounts],
	);

	const switchAccount = useCallback<SessionApiContext['switchAccount']>(
		async (account) => {
			// Validate the stored session resolves before committing the switch.
			await createAgentAndResume(account);
			writeSession({
				accounts: prependAccount(accounts, account),
				currentAccountDid: account.did,
			});
			history.pushState(null, '', '/');
			window.location.reload();
		},
		[accounts],
	);

	const logoutCurrentAccount = useCallback<SessionApiContext['logoutCurrentAccount']>(() => {
		signOut({ accounts, clearDids: currentDid ? [currentDid] : [] });
	}, [accounts, currentDid]);

	const logoutEveryAccount = useCallback<SessionApiContext['logoutEveryAccount']>(() => {
		signOut({ accounts, clearDids: accounts.map((a) => a.did) });
	}, [accounts]);

	const removeAccount = useCallback<SessionApiContext['removeAccount']>(
		(account) => {
			deleteStoredSession(account.did as AtcuteDid);
			void clearPersistedQueryStorage(account.did);
			const nextAccounts = accounts.filter((a) => a.did !== account.did);
			if (account.did === currentDid) {
				// Removing the signed-in account is a sign-out — reload.
				signOut({ accounts: nextAccounts });
			} else {
				setAccounts(nextAccounts);
				writeSession({ accounts: nextAccounts, currentAccountDid: currentDid });
			}
		},
		[accounts, currentDid],
	);

	const stateContext = useMemo<SessionStateContext>(
		() => ({
			accounts,
			currentAccount: accounts.find((a) => a.did === currentDid),
			hasSession: !!currentDid,
			isSessionResuming: status === 'resuming',
			sessionResumeFailed: status === 'failed',
		}),
		[accounts, currentDid, status],
	);

	const api = useMemo<SessionApiContext>(
		() => ({
			completeOAuthCallback,
			login,
			logoutCurrentAccount,
			logoutEveryAccount,
			removeAccount,
			switchAccount,
		}),
		[completeOAuthCallback, login, logoutCurrentAccount, logoutEveryAccount, removeAccount, switchAccount],
	);

	// Mirror the current clients to module scope so non-React callers can reach them.
	useEffect(() => {
		currentClients = clients;
	}, [clients]);

	// @ts-expect-error window type is not declared, debug only
	if (import.meta.env.DEV) window.agent = agent;

	return (
		<AgentContext.Provider value={agent}>
			<ClientsContext.Provider value={clients}>
				<StateContext.Provider value={stateContext}>
					<ApiContext.Provider value={api}>{children}</ApiContext.Provider>
				</StateContext.Provider>
			</ClientsContext.Provider>
		</AgentContext.Provider>
	);
}

/**
 * Reads the persisted session, migrating once from the legacy token-based session storage when the new
 * storage is empty.
 */
function readPersistedSession(): AuthSession {
	const stored = auth.get(['session']);
	if (stored) {
		return stored;
	}

	const legacy = persisted.get('session');
	const migrated: AuthSession = {
		accounts: legacy.accounts.map(({ did, handle }) => ({ did, handle })),
		currentAccountDid: legacy.currentAccount?.did,
	};
	if (migrated.accounts.length > 0) {
		auth.set(['session'], migrated);
	}
	return migrated;
}

export function useSession() {
	return useContext(StateContext);
}

export function useSessionApi() {
	return useContext(ApiContext);
}

export function useRequireAuth() {
	const { hasSession } = useSession();
	const closeAll = useCloseAllActiveElements();
	const { signinDialogControl } = useGlobalDialogsControlContext();

	return useCallback(
		(fn: () => unknown) => {
			if (hasSession) {
				fn();
			} else {
				closeAll();
				signinDialogControl.open({});
			}
		},
		[hasSession, signinDialogControl, closeAll],
	);
}

export function useAgent(): BskyAppAgent {
	const agent = useContext(AgentContext);
	if (!agent) {
		throw Error('useAgent() must be below <SessionProvider>.');
	}
	return agent;
}

/**
 * The `@atcute/client` clients for the current session. `pds` is `null` while logged out.
 *
 * @returns the session's clients.
 * @throws if called outside `<SessionProvider>`.
 */
export function useClients(): Clients {
	const clients = useContext(ClientsContext);
	if (!clients) {
		throw Error('useClients() must be below <SessionProvider>.');
	}
	return clients;
}

/**
 * The `@atcute/client` clients for the current session, for non-React callers. Prefer
 * {@link useClients} inside components.
 *
 * @returns the session's clients.
 * @throws if called before `<SessionProvider>` has mounted.
 */
export function getClients(): Clients {
	if (!currentClients) {
		throw Error('getClients() called before <SessionProvider> mounted.');
	}
	return currentClients;
}
