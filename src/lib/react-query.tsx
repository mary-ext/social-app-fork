import { AppState } from 'react-native';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import {
	type PersistQueryClientOptions,
	PersistQueryClientProvider,
	type PersistQueryClientProviderProps,
} from '@tanstack/react-query-persist-client';

import { useConstant } from '#/lib/hooks/use-constant';
import { createPersistedQueryStorage } from '#/lib/persisted-query-storage';

import { networkConfirmed, networkLost } from '#/state/events';
import { isQueryPersisted } from '#/state/queries/util';

declare global {
	interface Window {
		__TANSTACK_QUERY_CLIENT__: import('@tanstack/query-core').QueryClient;
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
		const json = (await res.json()) as { version?: unknown };
		if (json.version) {
			return true;
		} else {
			return false;
		}
	} catch (e) {
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
	if (AppState.currentState === 'active') {
		if (!onlineManager.isOnline() || isNetworkStateUnclear) {
			checkIsOnlineIfNeeded();
		}
	}
}, 2000);

focusManager.setEventListener((onFocus) => {
	if (typeof window !== 'undefined' && window.addEventListener) {
		// these handlers are a bit redundant but focus catches when the browser window
		// is blurred/focused while visibilitychange seems to only handle when the
		// window minimizes (both of them catch tab changes)
		// there's no harm to redundant fires because refetchOnWindowFocus is only
		// used with queries that employ stale data times
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
				// NOTE
				// refetchOnWindowFocus breaks some UIs (like feeds)
				// so we only selectively want to enable this
				// -prf
				refetchOnWindowFocus: false,
				// Structural sharing between responses makes it impossible to rely on
				// "first seen" timestamps on objects to determine if they're fresh.
				// Disable this optimization so that we can rely on "first seen" timestamps.
				structuralSharing: false,
				// We don't want to retry queries by default, because in most cases we
				// want to fail early and show a response to the user. There are
				// exceptions, and those can be made on a per-query basis. For others, we
				// should give users controls to retry.
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
			// Enforce we never reuse cache between users.
			// These two props MUST stay in sync.
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
	// initialDid is a mount-time snapshot used only for the invariant check below. useConstant (not useRef)
	// so the read during render isn't a ref access.
	const initialDid = useConstant(() => currentDid);
	if (currentDid !== initialDid) {
		throw Error('Something is very wrong. Expected did to be stable due to key above.');
	}
	// We create the query client here so that it's scoped to a specific DID.
	// Do not move the query client creation outside of this component.
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
