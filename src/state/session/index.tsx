import { createContext, type PropsWithChildren, useContext, useEffect, useSyncExternalStore } from 'react';

import { sessionDropped } from '#/state/events';
import type { SessionStateContext } from '#/state/session/types';

import { signinDialogHandle } from '#/components/dialogs/handles';

import { dropToGuest, getSnapshot, subscribe } from './store';

export type { SessionAccount } from '#/state/session/types';
export {
	completeOAuthCallback,
	getAccountProfileView,
	getClients,
	getCurrentDid,
	login,
	logoutCurrentAccount,
	logoutEveryAccount,
	removeAccount,
	switchAccount,
	updateAccountProfile,
} from './store';

const StateContext = createContext<SessionStateContext>({
	accounts: [],
	currentAccount: undefined,
	hasSession: false,
	isSessionResuming: false,
	sessionResumeFailed: false,
});
StateContext.displayName = 'SessionStateContext';

export function Provider({ children }: PropsWithChildren<{}>) {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot);

	// boot and cross-tab handling live in store.ts; this provider handles live session drops.
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

	const stateContext = {
		accounts: snapshot.accounts,
		currentAccount: snapshot.accounts.find((a) => a.did === snapshot.currentDid),
		hasSession: !!snapshot.currentDid,
		isSessionResuming: snapshot.status === 'resuming',
		sessionResumeFailed: snapshot.status === 'failed',
	};

	return <StateContext.Provider value={stateContext}>{children}</StateContext.Provider>;
}

export function useSession() {
	return useContext(StateContext);
}

export function useRequireAuth() {
	const { hasSession } = useSession();

	return (fn: () => unknown) => {
		if (hasSession) {
			fn();
		} else {
			signinDialogHandle.openWithPayload({});
		}
	};
}
