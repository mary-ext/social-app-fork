import type { ActorIdentifier, Did } from '@atcute/lexicons';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { clearPersistedQueryStorage } from '#/lib/persisted-query-storage';

import { sessionDropped } from '#/state/events';
import type { SessionAccount } from '#/state/session/types';

import { logger } from '#/logger';

import { auth } from '#/storage';

import {
	createGuestClients,
	createOAuthSession,
	InactiveAccountError,
	optimisticOAuthSession,
	resumeOAuthSession,
} from './agent';
import type { Clients } from './clients';
import {
	deleteStoredSession,
	IS_OAUTH_CALLBACK,
	OAuthResponseError,
	startOAuthSignIn,
	TokenRefreshError,
} from './oauth';

// #region snapshot

export type SessionBootStatus = 'failed' | 'idle' | 'resuming' | 'validating';

export type SessionSnapshot = {
	accounts: readonly SessionAccount[];
	clients: Clients;
	currentAccountDid: Did | undefined;
	currentDid: Did | undefined;
	status: SessionBootStatus;
};

let isWritingSession = false;
let snapshot: SessionSnapshot;

const emitter = new SimpleEventEmitter<[]>();

export function subscribe(onChange: () => void): () => void {
	return emitter.subscribe(onChange);
}

export function getSnapshot(): SessionSnapshot {
	return snapshot;
}

function setSnapshot(patch: Partial<SessionSnapshot>): void {
	snapshot = { ...snapshot, ...patch };
	emitter.emit();
}

function persistSnapshot(patch: Partial<SessionSnapshot>): void {
	const next = { ...snapshot, ...patch };
	isWritingSession = true;
	try {
		auth.set(['session'], { accounts: [...next.accounts], currentAccountDid: next.currentAccountDid });
	} finally {
		isWritingSession = false;
	}

	snapshot = next;
	emitter.emit();
}

// #endregion

// #region helpers

function prependAccount(accounts: readonly SessionAccount[], account: SessionAccount): SessionAccount[] {
	return [account, ...accounts.filter((a) => a.did !== account.did)];
}

function errorMessage(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}

function isFatalSessionError(e: unknown): boolean {
	return (
		e instanceof InactiveAccountError ||
		e instanceof TokenRefreshError ||
		(e instanceof OAuthResponseError && (e.status === 400 || e.status === 401))
	);
}

export function signOut({
	accounts,
	clearDids = [],
}: {
	accounts: readonly SessionAccount[];
	clearDids?: readonly string[];
}): void {
	for (const did of clearDids) {
		void clearPersistedQueryStorage(did);
	}
	persistSnapshot({ accounts, currentAccountDid: undefined });
	history.pushState(null, '', '/');
	window.location.reload();
}

export function dropToGuest(): void {
	persistSnapshot({
		clients: createGuestClients(),
		currentAccountDid: undefined,
		currentDid: undefined,
		status: 'failed',
	});
}

// #endregion

// #region api

export async function login({ identifier }: { identifier: ActorIdentifier }) {
	await startOAuthSignIn({ identifier });
}

export async function completeOAuthCallback(params: URLSearchParams) {
	const { account } = await createOAuthSession(params);
	persistSnapshot({
		accounts: prependAccount(snapshot.accounts, account),
		currentAccountDid: account.did,
	});
}

export async function switchAccount(account: SessionAccount) {
	// Validate the stored session resolves before committing the switch.
	await resumeOAuthSession(account);
	persistSnapshot({
		accounts: prependAccount(snapshot.accounts, account),
		currentAccountDid: account.did,
	});
	history.pushState(null, '', '/');
	window.location.reload();
}

export function logoutCurrentAccount() {
	signOut({ accounts: snapshot.accounts, clearDids: snapshot.currentDid ? [snapshot.currentDid] : [] });
}

export function logoutEveryAccount() {
	signOut({ accounts: snapshot.accounts, clearDids: snapshot.accounts.map((a) => a.did) });
}

export function removeAccount(account: SessionAccount) {
	deleteStoredSession(account.did);
	void clearPersistedQueryStorage(account.did);
	const nextAccounts = snapshot.accounts.filter((a) => a.did !== account.did);
	if (account.did === snapshot.currentDid) {
		// Removing the signed-in account is a sign-out — reload.
		signOut({ accounts: nextAccounts });
	} else {
		persistSnapshot({ accounts: nextAccounts });
	}
}

// #endregion

export function getClients() {
	return snapshot.clients;
}

{
	const persisted = auth.get(['session']);

	const bootAccount = IS_OAUTH_CALLBACK
		? undefined
		: persisted?.accounts.find((a) => a.did === persisted.currentAccountDid);

	snapshot = {
		accounts: persisted ? persisted.accounts : [],
		clients: createGuestClients(),
		currentAccountDid: persisted?.currentAccountDid,
		currentDid: undefined,
		status: bootAccount ? 'resuming' : 'idle',
	};

	if (bootAccount) {
		const account = bootAccount;
		let settled = false;

		// The stored session is unusable: drop back to a logged-out guest session so the next boot doesn't retry it.
		const failResume = (): void => {
			if (settled) {
				return;
			}
			settled = true;
			dropToGuest();
		};

		const resume = async (): Promise<void> => {
			let resumed: { clients: Clients; validate: () => Promise<SessionAccount> };
			try {
				resumed = await optimisticOAuthSession(account);
			} catch (resumeError) {
				if (!(resumeError instanceof TokenRefreshError)) {
					logger.error('session: boot resume failed', { message: errorMessage(resumeError) });
				}
				failResume();
				return;
			}
			// The agent is usable from the stored token — render now and validate the session against the server
			// in the background.
			setSnapshot({ clients: resumed.clients, currentDid: account.did, status: 'validating' });

			// A session dropped by live traffic during validation fails the resume; the global dropped-session
			// listener stays off until this settles.
			const unlistenDropped = sessionDropped.subscribe(failResume);
			try {
				await resumed.validate();
			} catch (validationError) {
				if (isFatalSessionError(validationError)) {
					failResume();
				} else {
					// A transient failure (e.g. network) — keep the optimistic session; live traffic will surface a
					// genuine failure.
					logger.error('session: boot validation failed', { message: errorMessage(validationError) });
				}
			} finally {
				unlistenDropped();
			}
			if (!settled) {
				settled = true;
				setSnapshot({ status: 'idle' });
			}
		};

		void resume();
	}
}

auth.onScopeChange(['session'], () => {
	if (isWritingSession) {
		return;
	}

	const next = auth.get(['session']);

	const accountChanged = next?.currentAccountDid !== snapshot.currentDid;
	const accountRemoved =
		snapshot.currentDid !== undefined &&
		!(next?.accounts.some((a) => a.did === snapshot.currentDid) ?? false);

	if (accountChanged || accountRemoved) {
		window.location.reload();
	}
});
