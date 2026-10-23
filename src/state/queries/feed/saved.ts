import type { AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { hydrateFeedGenerator, type SavedFeedItem } from '#/lib/feeds/source-info';
import { GCTIME, STALE } from '#/lib/query/const';

import { FEED_INFO_RQKEY_ROOT } from '#/state/queries/feed/keys';
import { precacheFeed, precacheList } from '#/state/queries/feed/precache';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { createQueryPersister } from '#/state/query-persister';
import { getClients } from '#/state/session';

const feedInfoQueryPersister = createQueryPersister({ version: 1 });

const createSavedFeedInfosQueryKey = (feedUris: string[]) => [
	FEED_INFO_RQKEY_ROOT,
	{
		kind: 'saved',
		feedUris,
	},
];

export function useSavedFeeds() {
	const { appview } = getClients();
	const { data: preferences, isLoading: isLoadingPrefs } = usePreferencesQuery();
	const savedItems = preferences?.savedFeeds ?? [];
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: createSavedFeedInfosQueryKey(savedItems.map((f) => f.value)),
		enabled: !isLoadingPrefs,
		staleTime: STALE.INFINITY,
		gcTime: GCTIME.DAYS.SEVEN,
		queryFn: async ({ signal }) => {
			const resolvedFeeds = new Map<string, AppBskyFeedDefs.GeneratorView>();
			const resolvedLists = new Map<string, AppBskyGraphDefs.ListView>();

			const savedFeeds = savedItems.filter((feed) => feed.type === 'feed');
			const savedLists = savedItems.filter((feed) => feed.type === 'list');

			let feedsPromise = Promise.resolve();
			if (savedFeeds.length > 0) {
				feedsPromise = ok(
					appview.get('app.bsky.feed.getFeedGenerators', {
						signal,
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `validateSavedFeed` enforces a matching at-uri
						params: { feeds: savedFeeds.map((f) => f.value as ResourceUri) },
					}),
				).then((data) => {
					data.feeds.forEach((f) => {
						resolvedFeeds.set(f.uri, f);
					});
				});
			}

			const listsPromises = savedLists.map((list) =>
				ok(
					appview.get('app.bsky.graph.getList', {
						signal,
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `validateSavedFeed` enforces a matching at-uri
						params: { list: list.value as ResourceUri, limit: 1 },
					}),
				).then((data) => {
					const listView = data.list;
					resolvedLists.set(listView.uri, listView);
				}),
			);

			await Promise.allSettled([feedsPromise, ...listsPromises]);

			resolvedFeeds.forEach((feed) => {
				const hydratedFeed = hydrateFeedGenerator(feed);
				precacheFeed(queryClient, hydratedFeed);
			});
			resolvedLists.forEach((list) => {
				precacheList(queryClient, list);
			});

			const result: SavedFeedItem[] = [];
			for (const savedItem of savedItems) {
				if (savedItem.type === 'timeline') {
					result.push({
						type: 'timeline',
						config: savedItem,
						view: undefined,
					});
				} else if (savedItem.type === 'feed') {
					const resolvedFeed = resolvedFeeds.get(savedItem.value);
					if (resolvedFeed) {
						result.push({
							type: 'feed',
							config: savedItem,
							view: resolvedFeed,
						});
					}
				} else if (savedItem.type === 'list') {
					const resolvedList = resolvedLists.get(savedItem.value);
					if (resolvedList) {
						result.push({
							type: 'list',
							config: savedItem,
							view: resolvedList,
						});
					}
				}
			}

			return {
				count: result.length,
				feeds: result,
			};
		},
		persister: feedInfoQueryPersister,
		placeholderData: (previousData) => {
			return (
				previousData || {
					count: savedItems.length,
					feeds: [],
				}
			);
		},
	});
}
