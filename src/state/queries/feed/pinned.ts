import type { AppBskyActorDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { mapDefined } from '@mary-ext/array-fns';
import { createBatchedFetch, ResourceMissingError } from '@mary-ext/batch-fetch';

import { useQueries, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { DISCOVER_FEED_URI, DISCOVER_SAVED_FEED } from '#/lib/constants/feeds';
import type { FeedDescriptor } from '#/lib/feeds/descriptor';
import {
	type FeedSourceInfo,
	hydrateFeedGenerator,
	hydrateList,
	type SavedFeedSourceInfo,
} from '#/lib/feeds/source-info';
import { GCTIME, STALE } from '#/lib/query/const';

import { FEED_INFO_RQKEY_ROOT } from '#/state/queries/feed/keys';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { createQueryPersister } from '#/state/query-persister';
import { getClients, useSession } from '#/state/session';

const PWI_DISCOVER_FEED_STUB: SavedFeedSourceInfo = {
	type: 'feed',
	displayName: 'Discover',
	uri: DISCOVER_FEED_URI,
	feedDescriptor: { type: 'feedgen', uri: DISCOVER_FEED_URI },
	target: { name: 'Home' },
	cid: '',
	avatar: '',
	description: undefined,
	creatorDid: undefined,
	creatorHandle: '',
	likeCount: 0,
	likeUri: '',
	// ---
	savedFeed: {
		id: 'pwi-discover',
		...DISCOVER_SAVED_FEED,
	},
	contentMode: undefined,
};

// keep descriptor identity stable across renders.
const FOLLOWING_FEED_DESCRIPTOR: FeedDescriptor = { type: 'following' };

const createFollowingFeedInfo = (savedFeed: AppBskyActorDefs.SavedFeed): SavedFeedSourceInfo => ({
	type: 'feed',
	displayName: 'Following',
	uri: savedFeed.value,
	feedDescriptor: FOLLOWING_FEED_DESCRIPTOR,
	target: { name: 'Home' },
	cid: '',
	avatar: '',
	description: undefined,
	creatorDid: undefined,
	creatorHandle: '',
	likeCount: 0,
	likeUri: '',
	savedFeed,
	contentMode: undefined,
});

const feedInfoQueryPersister = createQueryPersister({ version: 1 });

const createPinnedFeedInfoQueryKey = (uri: string) => [
	FEED_INFO_RQKEY_ROOT,
	{
		kind: 'pinned',
		uri,
	},
];

const fetchFeedGenerator = createBatchedFetch<ResourceUri, AppBskyFeedDefs.GeneratorView>({
	limit: 50,
	timeout: 0,
	fetch: async (feeds, signal) => {
		const { appview } = getClients();
		const data = await ok(appview.get('app.bsky.feed.getFeedGenerators', { signal, params: { feeds } }));
		return data.feeds;
	},
	idFromResource: (feed) => feed.uri,
});

const fetchPinnedFeedInfo = async (
	savedFeed: AppBskyActorDefs.SavedFeed,
	signal: AbortSignal,
): Promise<FeedSourceInfo | null> => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- validated by `validateSavedFeed`
	const uri = savedFeed.value as ResourceUri;

	if (savedFeed.type === 'feed') {
		try {
			return hydrateFeedGenerator(await fetchFeedGenerator(uri, signal));
		} catch (err) {
			// omitted generators are unavailable, not request failures.
			if (err instanceof ResourceMissingError) {
				return null;
			}
			throw err;
		}
	}

	const { appview } = getClients();
	const data = await ok(appview.get('app.bsky.graph.getList', { signal, params: { list: uri, limit: 1 } }));
	return hydrateList(data.list);
};

export function usePinnedFeedsInfos() {
	const { hasSession } = useSession();
	const queryClient = useQueryClient();
	const { data: preferences, isLoading: isLoadingPrefs } = usePreferencesQuery();
	const pinnedItems = preferences?.savedFeeds.filter((feed) => feed.pinned) ?? [];
	const fetchedItems = hasSession ? pinnedItems.filter((item) => item.type !== 'timeline') : [];

	const { resolved, error, isLoading, isPending, isError } = useQueries({
		queries: fetchedItems.map((item) => ({
			queryKey: createPinnedFeedInfoQueryKey(item.value),
			staleTime: STALE.MINUTES.FIFTEEN,
			gcTime: GCTIME.DAYS.SEVEN,
			queryFn({ signal }) {
				return fetchPinnedFeedInfo(item, signal);
			},
			persister: feedInfoQueryPersister,
		})),
		combine(results: UseQueryResult<FeedSourceInfo | null>[]) {
			return {
				resolved: mapDefined(results, (result) => result.data ?? undefined),
				error: results.find((result) => result.error)?.error ?? null,
				isLoading: results.some((result) => result.isLoading),
				// includes queries paused while offline.
				isPending: results.some((result) => result.isPending),
				// individual failures only remove their feed.
				isError: results.length > 0 && results.every((result) => result.isError),
			};
		},
	});

	const refetch = async () => {
		await Promise.all(
			fetchedItems.map((item) => {
				return queryClient.refetchQueries({
					queryKey: createPinnedFeedInfoQueryKey(item.value),
				});
			}),
		);
	};

	if (isLoadingPrefs) {
		return { data: undefined, error: null, isError: false, isLoading: true, refetch };
	}

	if (!hasSession) {
		return { data: [PWI_DISCOVER_FEED_STUB], error: null, isError: false, isLoading: false, refetch };
	}

	const byUri = new Map(resolved.map((feedInfo) => [feedInfo.uri, feedInfo]));
	const data = mapDefined(pinnedItems, (item): SavedFeedSourceInfo | undefined => {
		if (item.type === 'timeline') {
			return createFollowingFeedInfo(item);
		}

		const feedInfo = byUri.get(item.value);
		return feedInfo && { ...feedInfo, savedFeed: item };
	});

	return {
		// prevent home tabs from reordering while queries settle.
		data: isPending || isError ? undefined : data,
		error: isError ? error : null,
		isError,
		isLoading,
		refetch,
	};
}
