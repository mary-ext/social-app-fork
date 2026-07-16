import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Did } from '@atcute/lexicons';
import { deleteStoredSession, OAuthResponseError, TokenRefreshError } from '@atcute/oauth-browser-client';

import { clearPersistedQueryStorage } from '#/lib/persisted-query-storage';

import { sessionDropped } from '#/state/events';
import type { SessionAccount, SessionApiContext, SessionStateContext } from '#/state/session/types';

import { logger } from '#/logger';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';

import { auth, type AuthSession } from '#/storage';

import {
	createGuestClients,
	createOAuthSession,
	InactiveAccountError,
	optimisticOAuthSession,
	resumeOAuthSession,
} from './agent';
import type { Clients } from './clients';
import { IS_OAUTH_CALLBACK, startOAuthSignIn } from './oauth';

export type { SessionAccount } from '#/state/session/types';

/**
 * resolves the session once at boot, keeping it immutable for the page's lifetime. exceptions that avoid a
 * page reload are removing a non-current account, or dropping the current session to logged-out when the
 * token cannot be refreshed.
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

/**
 * drops the session to logged-out in place without reloading. persists the logged-out state, swaps in guest
 * clients, clears the current account, and marks the boot failed to trigger a session expired toast.
 */
function dropToGuestSession(
	accounts: SessionAccount[],
	setClients: (clients: Clients) => void,
	setCurrentDid: (did: Did | undefined) => void,
	setStatus: (status: SessionBootStatus) => void,
) {
	writeSession({ accounts, currentAccountDid: undefined });
	setClients(createGuestClients());
	setCurrentDid(undefined);
	setStatus('failed');
}

/** Extracts a loggable message from an unknown thrown value. */
function errorMessage(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}

/**
 * determines if a resume or validation error means the stored session is permanently unusable.
 *
 * returns true if the token was refused or can no longer be refreshed, and false if the failure is transient
 * and the session should be kept.
 */
function isFatalSessionError(e: unknown): boolean {
	return (
		e instanceof InactiveAccountError ||
		e instanceof TokenRefreshError ||
		(e instanceof OAuthResponseError && (e.status === 400 || e.status === 401))
	);
}

/**
 * boot lifecycle of the persisted session: - `resuming`: builds the agent from the stored token -
 * `validating`: keeps the agent live while the session is checked against the server - `failed`: the stored
 * session was rejected - `idle`: no stored session or a fully-settled resume
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
	const [clients, setClients] = useState<Clients>(createGuestClients);
	const [currentDid, setCurrentDid] = useState<Did | undefined>(undefined);
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

		// The stored session is unusable: drop back to a logged-out guest session so
		// the next boot doesn't retry it.
		const failResume = () => {
			if (settled) {
				return;
			}
			settled = true;
			dropToGuestSession(boot.accounts, setClients, setCurrentDid, setStatus);
		};

		const resume = async () => {
			let resumed: { clients: Clients; validate: () => Promise<SessionAccount> };
			try {
				resumed = await optimisticOAuthSession(bootAccount);
			} catch (resumeError) {
				if (cancelled) {
					return;
				}
				if (!(resumeError instanceof TokenRefreshError)) {
					logger.error('session: boot resume failed', { message: errorMessage(resumeError) });
				}
				failResume();
				return;
			}
			if (cancelled) {
				return;
			}
			// The agent is usable from the stored token — render now and validate
			// the session against the server in the background.
			setClients(resumed.clients);
			setCurrentDid(bootAccount.did);
			setStatus('validating');

			// A session dropped by live traffic during validation fails the resume;
			// the global dropped-session listener stays off until this settles.
			const unlistenDropped = sessionDropped.subscribe(() => {
				if (!cancelled) {
					failResume();
				}
			});
			try {
				await resumed.validate();
			} catch (validationError) {
				// these catch bindings must stay distinctly named, SWC React Compiler
				// seems to have an issue with renaming bindings that shares names.
				if (cancelled) {
					return;
				}
				if (isFatalSessionError(validationError)) {
					failResume();
				} else {
					// A transient failure (e.g. network) — keep the optimistic session;
					// live traffic will surface a genuine failure.
					logger.error('session: boot validation failed', { message: errorMessage(validationError) });
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

	// A live session dropped mid-use: the stored token can no longer be refreshed.
	// Drop to a logged-out guest session in place — no reload. Persisting the
	// logged-out session keeps a reload or another tab from resuming it, and
	// clearing the current account remounts the tree as logged out (via the
	// `key={currentAccount?.did}` reset in InnerApp), so in-flight requests fail
	// like any other and the UI surfaces them; `status` 'failed' raises the
	// "session expired" toast. Held off while the boot resume is still settling,
	// where it drops the session itself.
	useEffect(() => {
		if (currentDid === undefined || status === 'resuming' || status === 'validating') {
			return;
		}
		return sessionDropped.subscribe(() => {
			dropToGuestSession(accounts, setClients, setCurrentDid, setStatus);
		});
	}, [accounts, currentDid, status]);

	const login = useCallback<SessionApiContext['login']>(async ({ identifier }) => {
		await startOAuthSignIn({ identifier });
	}, []);

	const completeOAuthCallback = useCallback<SessionApiContext['completeOAuthCallback']>(
		async (params) => {
			const { account } = await createOAuthSession(params);
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
			await resumeOAuthSession(account);
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
			deleteStoredSession(account.did);
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

	return (
		<ClientsContext.Provider value={clients}>
			<StateContext.Provider value={stateContext}>
				<ApiContext.Provider value={api}>{children}</ApiContext.Provider>
			</StateContext.Provider>
		</ClientsContext.Provider>
	);
}

/** Reads the persisted session from storage, defaulting to a logged-out session. */
function readPersistedSession(): AuthSession {
	return auth.get(['session']) ?? { accounts: [], currentAccountDid: undefined };
}

export function useSession() {
	return useContext(StateContext);
}

export function useSessionApi() {
	return useContext(ApiContext);
}

export function useRequireAuth() {
	const { hasSession } = useSession();
	const { signinDialogHandle } = useGlobalDialogsHandleContext();

	return useCallback(
		(fn: () => unknown) => {
			if (hasSession) {
				fn();
			} else {
				signinDialogHandle.openWithPayload({});
			}
		},
		[hasSession, signinDialogHandle],
	);
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
 * The `@atcute/client` clients for the current session, for non-React callers. Prefer {@link useClients}
 * inside components.
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
