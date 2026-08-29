import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { dequal } from 'dequal/lite';

import { sessionDropped } from '#/state/events';
import { accountProfileView, toAccountProfile } from '#/state/session/account-profile';
import type { SessionAccount } from '#/state/session/types';

import { auth } from '#/storage';
import { clearPersistedQueryCache } from '#/storage/query-cache';

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
	status: SessionBootStatus;
	accounts: readonly SessionAccount[];
	clients: Clients;
	currentAccountDid: Did | undefined;
	currentDid: Did | undefined;
};

let isWritingSession = false;
let isReloading = false;
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
	if (isReloading) {
		// do not restore stale session state while another tab reloads after sign-out.
		return;
	}

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

function mergeAccount(accounts: readonly SessionAccount[], account: SessionAccount): SessionAccount {
	if (account.profile) {
		return account;
	}
	const existing = accounts.find((a) => a.did === account.did);
	return existing?.profile ? { ...account, profile: existing.profile } : account;
}

function prependAccount(accounts: readonly SessionAccount[], account: SessionAccount): SessionAccount[] {
	return [mergeAccount(accounts, account), ...accounts.filter((a) => a.did !== account.did)];
}

function replaceAccount(accounts: readonly SessionAccount[], account: SessionAccount): SessionAccount[] {
	const next = mergeAccount(accounts, account);
	return accounts.map((a) => (a.did === next.did ? next : a));
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
	clearDids?: readonly Did[];
}): void {
	for (const did of clearDids) {
		clearPersistedQueryCache(did);
	}
	persistSnapshot({ accounts, currentAccountDid: undefined });
	history.pushState(null, '', '/');
	window.location.reload();
}

export function dropToGuest(): void {
	persistSnapshot({
		status: 'failed',
		clients: createGuestClients(),
		currentAccountDid: undefined,
		currentDid: undefined,
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
	const { account: validated } = await resumeOAuthSession(account);
	persistSnapshot({
		accounts: prependAccount(snapshot.accounts, validated),
		currentAccountDid: validated.did,
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

/**
 * stores a resolved profile snapshot for a saved account.
 *
 * @param profile the resolved profile view
 */
export function updateAccountProfile(profile: AnyProfileView): void {
	const existing = getAccount(profile.did);
	if (!existing) {
		return;
	}

	// getSession is authoritative; appview can lag handle changes.
	const nextProfile = toAccountProfile(profile);
	if (dequal(existing.profile, nextProfile)) {
		return;
	}

	persistSnapshot({
		accounts: replaceAccount(snapshot.accounts, { ...existing, profile: nextProfile }),
	});
}

export function removeAccount(account: SessionAccount) {
	deleteStoredSession(account.did);
	clearPersistedQueryCache(account.did);
	const nextAccounts = snapshot.accounts.filter((a) => a.did !== account.did);
	if (account.did === snapshot.currentDid) {
		// removing the current account signs out and reloads.
		signOut({ accounts: nextAccounts });
	} else {
		persistSnapshot({ accounts: nextAccounts });
	}
}

// #endregion

export function getClients() {
	return snapshot.clients;
}

export function getCurrentDid() {
	return snapshot.currentDid;
}

function getAccount(did: Did): SessionAccount | undefined {
	return snapshot.accounts.find((a) => a.did === did);
}

/**
 * gets cached placeholder profile data for a saved account.
 *
 * @param did the account's did
 * @returns the basic profile view, if cached
 */
export function getAccountProfileView(did: Did): AppBskyActorDefs.ProfileViewBasic | undefined {
	const account = getAccount(did);
	return account && accountProfileView(account);
}

{
	const persisted = auth.get(['session']);

	const bootAccount = IS_OAUTH_CALLBACK
		? undefined
		: persisted?.accounts.find((a) => a.did === persisted.currentAccountDid);

	snapshot = {
		status: bootAccount ? 'resuming' : 'idle',
		accounts: persisted ? persisted.accounts : [],
		clients: createGuestClients(),
		currentAccountDid: persisted?.currentAccountDid,
		currentDid: undefined,
	};

	if (bootAccount) {
		const account = bootAccount;
		let settled = false;

		// prevent the next boot from retrying an unusable session.
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
				// an expired refresh token is an expected sign-out path.
				if (!(resumeError instanceof TokenRefreshError)) {
					console.error('session: boot resume failed', resumeError);
				}
				failResume();
				return;
			}
			// render from the stored token, then validate in the background.
			setSnapshot({ status: 'validating', clients: resumed.clients, currentDid: account.did });

			// handle live drops locally until validation settles.
			const unlistenDropped = sessionDropped.subscribe(failResume);
			try {
				const validated = await resumed.validate();
				if (validated.handle !== account.handle) {
					persistSnapshot({ accounts: replaceAccount(snapshot.accounts, validated) });
				}
			} catch (validationError) {
				if (isFatalSessionError(validationError)) {
					failResume();
				} else {
					// keep the optimistic session on transient failures.
					console.error('session: boot validation failed', validationError);
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

	// profile writes can occur before currentDid resolves.
	const accountChanged = next?.currentAccountDid !== snapshot.currentAccountDid;
	const accountRemoved =
		snapshot.currentAccountDid !== undefined &&
		!(next?.accounts.some((a) => a.did === snapshot.currentAccountDid) ?? false);

	if (accountChanged || accountRemoved) {
		isReloading = true;
		window.location.reload();
	}
});
