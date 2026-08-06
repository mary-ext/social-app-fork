import { useCallback, useEffect, useMemo, useRef } from 'react';

import type {
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyGraphDefs,
	AppBskyUnspeccedGetPopularFeedGenerators,
} from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateFeedGenerator } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';
import {
	type Did,
	type ParsedCanonicalResourceUri,
	parseCanonicalResourceUri,
} from '@atcute/lexicons/syntax';

import {
	type InfiniteData,
	keepPreviousData,
	type QueryClient,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { DISCOVER_FEED_URI, DISCOVER_SAVED_FEED } from '#/lib/constants';
import { sanitizeDisplayName } from '#/lib/display-names';
import type { Richtext, RichtextFacet } from '#/lib/rich-text';
import { feedTarget, listTarget } from '#/lib/routes/targets';

import { GCTIME, STALE } from '#/state/queries';
import { RQKEY as listQueryKey } from '#/state/queries/list';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { createQueryKey } from '#/state/queries/util';
import { getClients, useSession } from '#/state/session';

import { m } from '#/paraglide/messages';
import type { RouteTarget } from '#/routes';

import { useModerationOpts } from '../moderation/moderation-opts';
import type { FeedDescriptor } from './post-feed';
import { precacheResolvedUri } from './resolve-uri';

export type FeedSourceFeedInfo = {
	type: 'feed';
	uri: string;
	view?: AppBskyFeedDefs.GeneratorView;
	feedDescriptor: FeedDescriptor;
	target: RouteTarget;
	cid: string;
	avatar: string | undefined;
	displayName: string;
	description: Richtext | string | undefined;
	/** undefined on the pseudo-feeds (Following, the logged-out Discover stub), which have no creator. */
	creatorDid: Did | undefined;
	creatorHandle: string;
	likeCount: number | undefined;
	acceptsInteractions?: boolean;
	likeUri: string | undefined;
	contentMode: AppBskyFeedDefs.GeneratorView['contentMode'];
};

export type FeedSourceListInfo = {
	type: 'list';
	uri: string;
	view?: AppBskyGraphDefs.ListView;
	feedDescriptor: FeedDescriptor;
	target: RouteTarget;
	cid: string;
	avatar: string | undefined;
	displayName: string;
	description: Richtext | string | undefined;
	/** undefined on the pseudo-feeds (Following, the logged-out Discover stub), which have no creator. */
	creatorDid: Did | undefined;
	creatorHandle: string;
	contentMode: undefined;
};

export type FeedSourceInfo = FeedSourceFeedInfo | FeedSourceListInfo;

export function isFeedSourceFeedInfo(feed: FeedSourceInfo): feed is FeedSourceFeedInfo {
	return feed.type === 'feed';
}

const feedSourceInfoQueryKeyRoot = 'getFeedSourceInfo';
export const feedSourceInfoQueryKey = ({ uri }: { uri: string }) => [feedSourceInfoQueryKeyRoot, uri];

const feedSourceNSIDs = {
	feed: 'app.bsky.feed.generator',
	list: 'app.bsky.graph.list',
};

// both hydrators accept either kind of uri, and the collection decides which screen the source opens.
const recordTarget = (urip: ParsedCanonicalResourceUri): RouteTarget =>
	urip.collection === 'app.bsky.feed.generator'
		? feedTarget(urip.repo, urip.rkey)
		: listTarget(urip.repo, urip.rkey);

const hydrateDescription = (
	text: string | undefined,
	facets: RichtextFacet[] | undefined,
): Richtext | string | undefined => {
	if (!text) {
		return undefined;
	}

	if (facets) {
		return { text, facets };
	}

	return text;
};

export function hydrateFeedGenerator(view: AppBskyFeedDefs.GeneratorView): FeedSourceInfo {
	const urip = parseCanonicalResourceUri(view.uri);

	return {
		type: 'feed',
		uri: view.uri,
		view,
		feedDescriptor: `feedgen|${view.uri}`,
		cid: view.cid,
		target: recordTarget(urip),
		avatar: view.avatar,
		displayName: view.displayName
			? sanitizeDisplayName(view.displayName)
			: m['common.feeds.feedBy']({ handle: view.creator.handle }),
		description: hydrateDescription(view.description, view.descriptionFacets),
		creatorDid: view.creator.did,
		creatorHandle: view.creator.handle,
		likeCount: view.likeCount,
		acceptsInteractions: view.acceptsInteractions,
		likeUri: view.viewer?.like,
		contentMode: view.contentMode,
	};
}

export function hydrateList(view: AppBskyGraphDefs.ListView): FeedSourceInfo {
	const urip = parseCanonicalResourceUri(view.uri);

	return {
		type: 'list',
		uri: view.uri,
		view,
		feedDescriptor: `list|${view.uri}`,
		target: recordTarget(urip),
		cid: view.cid,
		avatar: view.avatar,
		description: hydrateDescription(view.description, view.descriptionFacets),
		creatorDid: view.creator.did,
		creatorHandle: view.creator.handle,
		displayName: view.name
			? sanitizeDisplayName(view.name)
			: m['state.list.byCreator']({ handle: view.creator.handle }),
		contentMode: undefined,
	};
}

export function getFeedTypeFromUri(uri: string) {
	const { collection } = parseCanonicalResourceUri(uri);
	return collection === feedSourceNSIDs.feed ? 'feed' : 'list';
}

export function useFeedSourceInfoQuery({ uri }: { uri: string | undefined }) {
	const { appview } = getClients();

	return useQuery({
		queryKey: feedSourceInfoQueryKey({ uri: uri ?? '' }),
		staleTime: STALE.INFINITY,
		enabled: !!uri,
		queryFn: async () => {
			// `enabled` gates the query on `uri`, so this only fires if that gate is ever removed
			if (!uri) {
				throw new Error('getFeedSourceInfo: query ran without a uri');
			}

			let view: FeedSourceInfo;

			if (getFeedTypeFromUri(uri) === 'feed') {
				const data = await ok(
					appview.get('app.bsky.feed.getFeedGenerator', {
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `FeedSourceInfo.uri` widens to `string` only for the Following pseudo-feed
						params: { feed: uri as ResourceUri },
					}),
				);
				view = hydrateFeedGenerator(data.view);
			} else {
				const data = await ok(
					appview.get('app.bsky.graph.getList', {
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `FeedSourceInfo.uri` widens to `string` only for the Following pseudo-feed
						params: { list: uri as ResourceUri, limit: 1 },
					}),
				);
				view = hydrateList(data.list);
			}

			return view;
		},
	});
}

// the protocol does not identify personalized feeds, so exclude known
// authenticated-only recommendations for logged-out users.
export const KNOWN_AUTHED_ONLY_FEEDS = [
	'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends', // popular with friends, by bsky.app
	'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/mutuals', // mutuals, by skyfeed
	'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/only-posts', // only posts, by skyfeed
	'at://did:plc:wzsilnxf24ehtmmc3gssy5bu/app.bsky.feed.generator/mentions', // mentions, by flicknow
	'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/bangers', // my bangers, by jaz
	'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/mutuals', // mutuals, by bluesky
	'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/my-followers', // followers, by jaz
	'at://did:plc:vpkhqolt662uhesyj6nxm7ys/app.bsky.feed.generator/followpics', // the gram, by why
];

type GetPopularFeedsOptions = { limit?: number; enabled?: boolean };

export function createGetPopularFeedsQueryKey(options?: GetPopularFeedsOptions) {
	return ['getPopularFeeds', options?.limit];
}

export function useGetPopularFeedsQuery(options?: GetPopularFeedsOptions) {
	const { hasSession } = useSession();
	const { appview } = getClients();
	const limit = options?.limit || 10;
	const { data: preferences } = usePreferencesQuery();
	const queryClient = useQueryClient();
	const moderationOpts = useModerationOpts();

	// keep the selector stable unless one of its inputs changes.
	const selectArgs = useMemo(
		() => ({
			hasSession,
			savedFeeds: preferences?.savedFeeds || [],
			moderationOpts,
		}),
		[hasSession, preferences?.savedFeeds, moderationOpts],
	);
	const lastPageCountRef = useRef(0);

	const query = useInfiniteQuery({
		queryKey: createGetPopularFeedsQueryKey(options),
		enabled: !!moderationOpts && options?.enabled !== false,
		queryFn: async ({ pageParam }) => {
			const data = await ok(
				appview.get('app.bsky.unspecced.getPopularFeedGenerators', {
					params: { limit, cursor: pageParam },
				}),
			);

			for (const feed of data.feeds) {
				const hydratedFeed = hydrateFeedGenerator(feed);
				precacheFeed(queryClient, hydratedFeed);
			}

			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		select: useCallback(
			(data: InfiniteData<AppBskyUnspeccedGetPopularFeedGenerators.$output>) => {
				// oxlint-disable-next-line no-shadow -- shadowing is the point: it stops the callback from reading a stale closure copy instead of `selectArgs`
				const { savedFeeds, hasSession: hasSessionInner, moderationOpts } = selectArgs;
				return {
					...data,
					pages: data.pages.map((page) => {
						return {
							...page,
							feeds: page.feeds.filter((feed) => {
								if (!hasSessionInner && KNOWN_AUTHED_ONLY_FEEDS.includes(feed.uri)) {
									return false;
								}
								const alreadySaved = !!savedFeeds?.find((f) => {
									return f.value === feed.uri;
								});
								const decision = moderateFeedGenerator(feed, moderationOpts!);
								return (
									!alreadySaved &&
									getDisplayRestrictions(decision, DisplayContext.ContentList).filters.length === 0
								);
							}),
						};
					}),
				};
			},
			[selectArgs],
		),
	});

	useEffect(() => {
		const { isFetching, hasNextPage, data } = query;
		if (isFetching || !hasNextPage) {
			return;
		}

		// avoid double-fires of fetchNextPage()
		if (lastPageCountRef.current !== 0 && lastPageCountRef.current === data?.pages?.length) {
			return;
		}

		// fetch next page if we haven't gotten a full page of content
		let count = 0;
		for (const page of data?.pages || []) {
			count += page.feeds.length;
		}
		if (count < limit && (data?.pages.length || 0) < 6) {
			void query.fetchNextPage();
			lastPageCountRef.current = data?.pages?.length || 0;
		}
	}, [query, limit]);

	return query;
}

export function useSearchPopularFeedsMutation() {
	const { appview } = getClients();
	const moderationOpts = useModerationOpts();

	return useMutation({
		mutationFn: async (query: string) => {
			const data = await ok(
				appview.get('app.bsky.unspecced.getPopularFeedGenerators', {
					params: { limit: 10, query: query },
				}),
			);

			if (moderationOpts) {
				return data.feeds.filter((feed) => {
					const decision = moderateFeedGenerator(feed, moderationOpts);
					return getDisplayRestrictions(decision, DisplayContext.ContentMedia).blurs.length === 0;
				});
			}

			return data.feeds;
		},
	});
}

const popularFeedsSearchQueryKeyRoot = 'popularFeedsSearch';
export const createPopularFeedsSearchQueryKey = (query: string) => [popularFeedsSearchQueryKeyRoot, query];

export function usePopularFeedsSearch({ query, enabled }: { query: string; enabled?: boolean }) {
	const { appview } = getClients();
	const moderationOpts = useModerationOpts();
	const enabledInner = enabled ?? !!moderationOpts;

	return useQuery({
		queryKey: createPopularFeedsSearchQueryKey(query),
		enabled: enabledInner,
		queryFn: async () => {
			const data = await ok(
				appview.get('app.bsky.unspecced.getPopularFeedGenerators', {
					params: { limit: 15, query: query },
				}),
			);

			return data.feeds;
		},
		placeholderData: keepPreviousData,
		select(data) {
			return data.filter((feed) => {
				const decision = moderateFeedGenerator(feed, moderationOpts!);
				return getDisplayRestrictions(decision, DisplayContext.ContentMedia).blurs.length === 0;
			});
		},
	});
}

export type SavedFeedSourceInfo = FeedSourceInfo & {
	savedFeed: AppBskyActorDefs.SavedFeed;
};

const PWI_DISCOVER_FEED_STUB: SavedFeedSourceInfo = {
	type: 'feed',
	displayName: 'Discover',
	uri: DISCOVER_FEED_URI,
	feedDescriptor: `feedgen|${DISCOVER_FEED_URI}`,
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

export const FEED_INFO_RQKEY_ROOT = 'feed-info';

const createPinnedFeedInfosQueryKey = (kind: 'pinned' | 'saved', feedUris: string[]) =>
	createQueryKey(
		FEED_INFO_RQKEY_ROOT,
		{
			kind,
			feedUris,
		},
		{
			persistedVersion: 1,
		},
	);

export function usePinnedFeedsInfos() {
	const { hasSession } = useSession();
	const { appview } = getClients();
	const { data: preferences, isLoading: isLoadingPrefs } = usePreferencesQuery();
	const pinnedItems = preferences?.savedFeeds.filter((feed) => feed.pinned) ?? [];

	return useQuery({
		queryKey: createPinnedFeedInfosQueryKey(
			'pinned',
			pinnedItems.map((f) => f.value),
		),
		enabled: !isLoadingPrefs,
		staleTime: STALE.MINUTES.FIFTEEN,
		gcTime: GCTIME.INFINITY,
		queryFn: async () => {
			if (!hasSession) {
				return [PWI_DISCOVER_FEED_STUB];
			}

			const resolved = new Map<string, FeedSourceInfo>();

			// feeds support a batch request.
			const pinnedFeeds = pinnedItems.filter((feed) => feed.type === 'feed');
			let feedsPromise = Promise.resolve();
			if (pinnedFeeds.length > 0) {
				feedsPromise = ok(
					appview.get('app.bsky.feed.getFeedGenerators', {
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `validateSavedFeed` enforces a matching at-uri
						params: { feeds: pinnedFeeds.map((f) => f.value as ResourceUri) },
					}),
				).then((data) => {
					for (let i = 0; i < data.feeds.length; i++) {
						const feedView = data.feeds[i]!;
						resolved.set(feedView.uri, hydrateFeedGenerator(feedView));
					}
				});
			}

			// lists require individual requests.
			const pinnedLists = pinnedItems.filter((feed) => feed.type === 'list');
			const listsPromises = pinnedLists.map((list) =>
				ok(
					appview.get('app.bsky.graph.getList', {
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `validateSavedFeed` enforces a matching at-uri
						params: { list: list.value as ResourceUri, limit: 1 },
					}),
				).then((data) => {
					const listView = data.list;
					resolved.set(listView.uri, hydrateList(listView));
				}),
			);

			await feedsPromise; // fail the whole query if the batch fails.
			await Promise.allSettled(listsPromises); // ignore individual list failures.

			const result: SavedFeedSourceInfo[] = [];
			for (const pinnedItem of pinnedItems) {
				const feedInfo = resolved.get(pinnedItem.value);
				if (feedInfo) {
					result.push({
						...feedInfo,
						savedFeed: pinnedItem,
					});
				} else if (pinnedItem.type === 'timeline') {
					result.push({
						type: 'feed',
						displayName: 'Following',
						uri: pinnedItem.value,
						feedDescriptor: 'following',
						target: { name: 'Home' },
						cid: '',
						avatar: '',
						description: undefined,
						creatorDid: undefined,
						creatorHandle: '',
						likeCount: 0,
						likeUri: '',
						savedFeed: pinnedItem,
						contentMode: undefined,
					});
				}
			}
			return result;
		},
	});
}

export type SavedFeedItem =
	| {
			type: 'feed';
			config: AppBskyActorDefs.SavedFeed;
			view: AppBskyFeedDefs.GeneratorView;
	  }
	| {
			type: 'list';
			config: AppBskyActorDefs.SavedFeed;
			view: AppBskyGraphDefs.ListView;
	  }
	| {
			type: 'timeline';
			config: AppBskyActorDefs.SavedFeed;
			view: undefined;
	  };

export function useSavedFeeds() {
	const { appview } = getClients();
	const { data: preferences, isLoading: isLoadingPrefs } = usePreferencesQuery();
	const savedItems = preferences?.savedFeeds ?? [];
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: createPinnedFeedInfosQueryKey(
			'saved',
			savedItems.map((f) => f.value),
		),
		enabled: !isLoadingPrefs,
		staleTime: STALE.INFINITY,
		gcTime: GCTIME.INFINITY,
		queryFn: async () => {
			const resolvedFeeds = new Map<string, AppBskyFeedDefs.GeneratorView>();
			const resolvedLists = new Map<string, AppBskyGraphDefs.ListView>();

			const savedFeeds = savedItems.filter((feed) => feed.type === 'feed');
			const savedLists = savedItems.filter((feed) => feed.type === 'list');

			let feedsPromise = Promise.resolve();
			if (savedFeeds.length > 0) {
				feedsPromise = ok(
					appview.get('app.bsky.feed.getFeedGenerators', {
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

function precacheFeed(queryClient: QueryClient, hydratedFeed: FeedSourceInfo) {
	// a pseudo-feed has no creator to seed the handle/did cache with
	if (hydratedFeed.creatorDid) {
		precacheResolvedUri(queryClient, hydratedFeed.creatorHandle, hydratedFeed.creatorDid);
	}
	queryClient.setQueryData<FeedSourceInfo>(feedSourceInfoQueryKey({ uri: hydratedFeed.uri }), hydratedFeed);
}

export function precacheList(queryClient: QueryClient, list: AppBskyGraphDefs.ListView) {
	precacheResolvedUri(queryClient, list.creator.handle, list.creator.did);
	queryClient.setQueryData<AppBskyGraphDefs.ListView>(listQueryKey(list.uri), list);
}

export function precacheFeedFromGeneratorView(queryClient: QueryClient, view: AppBskyFeedDefs.GeneratorView) {
	const hydratedFeed = hydrateFeedGenerator(view);
	precacheFeed(queryClient, hydratedFeed);
}
