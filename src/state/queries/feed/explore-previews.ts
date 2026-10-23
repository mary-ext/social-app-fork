import type { AppBskyActorDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { type InfiniteData, type QueryClient, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { serializeUserInterests } from '#/lib/bsky-topics';
import { cleanError } from '#/lib/errors';
import { useConstant } from '#/lib/hooks/use-constant';
import { STALE } from '#/lib/query/const';

import {
	didOrHandleUriMatches,
	embedViewRecordToPostView,
	getEmbeddedPost,
} from '#/state/cache/finder-utils';
import { registerShadowFinders } from '#/state/cache/registry';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { CustomFeedAPI } from '#/state/queries/feed/lib/api/custom';
import { buildFeedPreviewItems, type FeedPreviewPage } from '#/state/queries/feed/lib/explore-preview-items';
import type { FeedPreviewItem } from '#/state/queries/feed/types';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { getClients } from '#/state/session';

import { m } from '#/paraglide/messages';

const RQKEY_ROOT = 'feed-previews';
const RQKEY = (feeds: string[]) => [RQKEY_ROOT, feeds];
const FEED_RQKEY = (feed: string) => ['feed-preview', feed];

const LIMIT = 8; // sliced to 6, overfetch to account for moderation

export function useFeedPreviews(
	feedsMaybeWithDuplicates: AppBskyFeedDefs.GeneratorView[],
	isEnabled: boolean,
) {
	const feeds = feedsMaybeWithDuplicates.filter((f, i, a) => i === a.findIndex((f2) => f.uri === f2.uri));

	const uris = feeds.map((feed) => feed.uri);
	const queryClient = useQueryClient();
	const { appview } = getClients();
	const { data: preferences } = usePreferencesQuery();
	const userInterests = serializeUserInterests(preferences);
	const moderationOpts = useModerationOpts();
	const enabled = feeds.length > 0 && isEnabled;

	// stable per-instance cache; useConstant (not useRef) so reads/writes inside the data memo (which
	// runs during render) aren't ref accesses. processed pages bake in moderation, which isn't part of
	// the page key, so we nest the page cache under the moderationOpts it was built with and drop stale
	// entries when the opts change.
	const processedPageCache = useConstant(
		() => new Map<ModerationOptions | undefined, Map<FeedPreviewPage, FeedPreviewItem[]>>(),
	);

	const query = useInfiniteQuery({
		queryKey: RQKEY(uris),
		enabled,
		staleTime: STALE.MINUTES.THREE,
		queryFn: async ({ pageParam }) => {
			const feed = feeds[pageParam]!;
			// reuse previews across suggestion lists while they're fresh.
			return queryClient.fetchQuery({
				queryKey: FEED_RQKEY(feed.uri),
				staleTime: STALE.MINUTES.THREE,
				gcTime: STALE.MINUTES.THREE,
				// use this query's signal: cancelling one suggestion list must not abort a shared fetch.
				queryFn: async ({ signal }): Promise<FeedPreviewPage> => {
					const api = new CustomFeedAPI({
						appview,
						feedParams: { feed: feed.uri },
						userInterests,
					});
					const data = await api.fetch({ cursor: undefined, limit: LIMIT, signal });
					return {
						feed,
						posts: data.feed,
					};
				},
			});
		},
		initialPageParam: 0,
		getNextPageParam: (_page, _pages, pageParam) =>
			pageParam + 1 < feeds.length ? pageParam + 1 : undefined,
	});

	const { data, isFetched, isError, isPending, error } = query;
	const items: FeedPreviewItem[] = [];

	if (enabled) {
		// scope the cache to the current moderationOpts; dropping entries built under stale opts so we
		// don't serve items filtered/hidden under outdated moderation settings.
		let pageCache = processedPageCache.get(moderationOpts);
		if (!pageCache) {
			processedPageCache.clear();
			pageCache = new Map();
			processedPageCache.set(moderationOpts, pageCache);
		}

		items.push({
			type: 'preview:spacer',
			key: 'spacer',
		});

		const isEmpty = !isPending && !data?.pages?.some((page) => page.posts.length);

		if (isFetched) {
			if (isError && isEmpty) {
				items.push({
					type: 'preview:error',
					key: 'error',
					message: m['state.feeds.error.fetch'](),
					error: cleanError(error),
				});
			} else if (isEmpty) {
				items.push({
					type: 'preview:empty',
					key: 'empty',
				});
			} else if (data) {
				for (const page of data.pages) {
					let processedPage = pageCache.get(page);
					if (!processedPage) {
						processedPage = buildFeedPreviewItems(page, moderationOpts);
						pageCache.set(page, processedPage);
					}
					items.push(...processedPage);
				}
			} else if (isError && !isEmpty) {
				items.push({
					type: 'preview:loadMoreError',
					key: 'loadMoreError',
				});
			}
		} else {
			items.push({
				type: 'preview:loading',
				key: 'loading',
			});
		}
	}

	return {
		query,
		data: items,
	};
}

// #region shadow finders

function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
	const atUri = parseResourceUri(uri);

	const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPreviewPage>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const item of page.posts) {
				if (didOrHandleUriMatches(atUri, item.post)) {
					yield item.post;
				}

				const quotedPost = getEmbeddedPost(item.post.embed);
				if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
					yield embedViewRecordToPostView(quotedPost);
				}

				if (item.reply?.parent?.$type === 'app.bsky.feed.defs#postView') {
					if (didOrHandleUriMatches(atUri, item.reply.parent)) {
						yield item.reply.parent;
					}

					const parentQuotedPost = getEmbeddedPost(item.reply.parent.embed);
					if (parentQuotedPost && didOrHandleUriMatches(atUri, parentQuotedPost)) {
						yield embedViewRecordToPostView(parentQuotedPost);
					}
				}

				if (item.reply?.root?.$type === 'app.bsky.feed.defs#postView') {
					if (didOrHandleUriMatches(atUri, item.reply.root)) {
						yield item.reply.root;
					}

					const rootQuotedPost = getEmbeddedPost(item.reply.root.embed);
					if (rootQuotedPost && didOrHandleUriMatches(atUri, rootQuotedPost)) {
						yield embedViewRecordToPostView(rootQuotedPost);
					}
				}
			}
		}
	}
}

function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileViewBasic, undefined> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPreviewPage>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const item of page.posts) {
				if (item.post.author.did === did) {
					yield item.post.author;
				}
				const quotedPost = getEmbeddedPost(item.post.embed);
				if (quotedPost?.author.did === did) {
					yield quotedPost.author;
				}
				if (
					item.reply?.parent?.$type === 'app.bsky.feed.defs#postView' &&
					item.reply?.parent?.author.did === did
				) {
					yield item.reply.parent.author;
				}
				if (
					item.reply?.root?.$type === 'app.bsky.feed.defs#postView' &&
					item.reply?.root?.author.did === did
				) {
					yield item.reply.root.author;
				}
			}
		}
	}
}

registerShadowFinders(RQKEY_ROOT, {
	findPosts: findAllPostsInQueryData,
	findProfiles: findAllProfilesInQueryData,
});

// #endregion
