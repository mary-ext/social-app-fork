import type { ReactNode } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import {
	focusManager,
	onlineManager,
	type Query,
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query';

import { isDocumentVisible } from '#/lib/browser/visibility';
import { useConstant } from '#/lib/hooks/use-constant';

import { networkConfirmed, networkLost } from '#/state/events';
import { PROFILE_RQKEY_ROOT } from '#/state/queries/profile-key';
import { updateAccountProfile } from '#/state/session';

declare global {
	interface Window {
		__TANSTACK_QUERY_CLIENT__: QueryClient;
	}
}

async function checkIsOnline(): Promise<boolean> {
	try {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, 15e3);
		const res = await fetch('https://public.api.bsky.app/xrpc/_health', {
			cache: 'no-store',
			signal: controller.signal,
		});
		const json: { version?: unknown } = await res.json();
		if (json.version) {
			return true;
		} else {
			return false;
		}
	} catch {
		return false;
	}
}

let receivedNetworkLost = false;
let receivedNetworkConfirmed = false;
let isNetworkStateUnclear = false;

networkLost.subscribe(() => {
	receivedNetworkLost = true;
	onlineManager.setOnline(false);
});

networkConfirmed.subscribe(() => {
	receivedNetworkConfirmed = true;
	onlineManager.setOnline(true);
});

let checkPromise: Promise<void> | undefined;
function checkIsOnlineIfNeeded() {
	if (checkPromise) {
		return;
	}
	receivedNetworkLost = false;
	receivedNetworkConfirmed = false;
	checkPromise = checkIsOnline().then((nextIsOnline) => {
		checkPromise = undefined;

		isNetworkStateUnclear =
			(nextIsOnline && receivedNetworkLost) || (!nextIsOnline && receivedNetworkConfirmed);

		if (!isNetworkStateUnclear) {
			onlineManager.setOnline(nextIsOnline);
		}
	});
}

setInterval(() => {
	if (isDocumentVisible()) {
		if (!onlineManager.isOnline() || isNetworkStateUnclear) {
			checkIsOnlineIfNeeded();
		}
	}
}, 2000);

focusManager.setEventListener((onFocus) => {
	if (typeof window !== 'undefined' && window.addEventListener) {
		const handler = () => onFocus();
		window.addEventListener('focus', handler, false);
		window.addEventListener('visibilitychange', handler, false);
		return () => {
			window.removeEventListener('visibilitychange', handler);
			window.removeEventListener('focus', handler);
		};
	}
});

const onQuerySuccess = (data: unknown, query: Query<unknown, unknown>) => {
	if (query.queryKey[0] !== PROFILE_RQKEY_ROOT) {
		return;
	}
	if (isProfileView(data)) {
		updateAccountProfile(data);
	}
};

const isProfileView = (data: unknown): data is AnyProfileView => {
	return typeof data === 'object' && data !== null && 'did' in data && 'handle' in data;
};

const createQueryClient = () =>
	new QueryClient({
		queryCache: new QueryCache({ onSuccess: onQuerySuccess }),
		defaultOptions: {
			queries: {
				// feeds opt in to refetching on focus when needed.
				refetchOnWindowFocus: false,
				// preserve object identity changes used by first-seen timestamps.
				structuralSharing: false,
				// queries opt in to retries when they can recover automatically.
				retry: false,
			},
		},
	});

export function QueryProvider({
	children,
	currentDid,
}: {
	children: ReactNode;
	currentDid: Did | undefined;
}) {
	return (
		<QueryProviderInner
			// key the provider by account so caches are not shared.
			key={currentDid}
			currentDid={currentDid}
		>
			{children}
		</QueryProviderInner>
	);
}

function QueryProviderInner({ children, currentDid }: { children: ReactNode; currentDid: Did | undefined }) {
	// keep a mount-time snapshot for the account invariant.
	const initialDid = useConstant(() => currentDid);
	if (currentDid !== initialDid) {
		throw Error('Something is very wrong. Expected did to be stable due to key above.');
	}
	// create the client inside the account-keyed subtree.
	const queryClient = useConstant(() => createQueryClient());
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
