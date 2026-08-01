import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';

import { sessionDropped } from '#/state/events';
import type { SessionStateContext } from '#/state/session/types';

import { signinDialogHandle } from '#/components/dialogs/handles';

import { dropToGuest, getSnapshot, subscribe } from './store';

export type { SessionAccount } from '#/state/session/types';
export {
	completeOAuthCallback,
	getClients,
	getCurrentDid,
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

	return useCallback(
		(fn: () => unknown) => {
			if (hasSession) {
				fn();
			} else {
				signinDialogHandle.openWithPayload({});
			}
		},
		[hasSession],
	);
}
