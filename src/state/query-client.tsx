import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import {
	type PersistQueryClientOptions,
	PersistQueryClientProvider,
	type PersistQueryClientProviderProps,
} from '@tanstack/react-query-persist-client';

import { useConstant } from '#/lib/hooks/use-constant';
import { createPersistedQueryStorage } from '#/lib/persisted-query-storage';
import { isDocumentVisible } from '#/lib/visibility';

import { networkConfirmed, networkLost } from '#/state/events';
import { isQueryPersisted } from '#/state/queries/util';

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
		if (nextIsOnline && receivedNetworkLost) {
			isNetworkStateUnclear = true;
		}
		if (!nextIsOnline && receivedNetworkConfirmed) {
			isNetworkStateUnclear = true;
		}
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

const createQueryClient = () =>
	new QueryClient({
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

const dehydrateOptions: PersistQueryClientProviderProps['persistOptions']['dehydrateOptions'] = {
	shouldDehydrateMutation: (_: unknown) => false,
	shouldDehydrateQuery: (query) => {
		return isQueryPersisted(query.queryKey);
	},
};

export function QueryProvider({
	children,
	currentDid,
}: {
	children: React.ReactNode;
	currentDid: string | undefined;
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

function QueryProviderInner({
	children,
	currentDid,
}: {
	children: React.ReactNode;
	currentDid: string | undefined;
}) {
	// keep a mount-time snapshot for the account invariant.
	const initialDid = useConstant(() => currentDid);
	if (currentDid !== initialDid) {
		throw Error('Something is very wrong. Expected did to be stable due to key above.');
	}
	// create the client inside the account-keyed subtree.
	const queryClient = useConstant(() => createQueryClient());
	const persistOptions = useConstant(() => {
		const storage = createPersistedQueryStorage(currentDid ?? 'logged-out');
		const asyncPersister = createAsyncStoragePersister({
			storage,
			key: 'queryClient-' + (currentDid ?? 'logged-out'),
		});
		return {
			persister: asyncPersister,
			dehydrateOptions,
			buster: import.meta.env.PUBLIC_GIT_COMMIT_HASH || 'dev',
		} satisfies Omit<PersistQueryClientOptions, 'queryClient'>;
	});
	return (
		<PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
			{children}
		</PersistQueryClientProvider>
	);
}
