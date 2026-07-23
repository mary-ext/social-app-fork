import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';

import { sessionDropped } from '#/state/events';
import type { SessionStateContext } from '#/state/session/types';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';

import { dropToGuest, getSnapshot, subscribe } from './store';

export type { SessionAccount } from '#/state/session/types';
export {
	completeOAuthCallback,
	getClients,
	login,
	logoutCurrentAccount,
	logoutEveryAccount,
	removeAccount,
	switchAccount,
} from './store';

const StateContext = createContext<SessionStateContext>({
	accounts: [],
	currentAccount: undefined,
	hasSession: false,
	isSessionResuming: false,
	sessionResumeFailed: false,
});
StateContext.displayName = 'SessionStateContext';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot);

	// Boot resume and cross-tab watching run once at module load (see store.ts); the only lifecycle the Provider
	// owns is the live-drop listener below, which must react to session state.
	//
	// A live session dropped mid-use: the stored token can no longer be refreshed. Drop to a logged-out guest
	// session in place — no reload. Persisting the logged-out session keeps a reload or another tab from
	// resuming it, and clearing the current account remounts the tree as logged out (via the
	// `key={currentAccount?.did}` reset in InnerApp), so in-flight requests fail like any other and the UI
	// surfaces them; `status` 'failed' raises the "session expired" toast. Held off while the boot resume is
	// still settling, where it drops the session itself.
	useEffect(() => {
		if (
			snapshot.currentDid === undefined ||
			snapshot.status === 'resuming' ||
			snapshot.status === 'validating'
		) {
			return;
		}
		return sessionDropped.subscribe(() => dropToGuest());
	}, [snapshot.currentDid, snapshot.status]);

	const stateContext = useMemo<SessionStateContext>(
		() => ({
			accounts: snapshot.accounts,
			currentAccount: snapshot.accounts.find((a) => a.did === snapshot.currentDid),
			hasSession: !!snapshot.currentDid,
			isSessionResuming: snapshot.status === 'resuming',
			sessionResumeFailed: snapshot.status === 'failed',
		}),
		[snapshot],
	);

	return <StateContext.Provider value={stateContext}>{children}</StateContext.Provider>;
}

export function useSession() {
	return useContext(StateContext);
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
