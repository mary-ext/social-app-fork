import { useRef } from 'react';

import type { AppBskyActorDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderatePost,
	ModerationCauseType,
} from '@atcute/bluesky-moderation';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { mapDefined } from '@mary-ext/array-fns';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import type { FeedDescriptor } from '#/lib/feeds/descriptor';
import { STALE } from '#/lib/query/const';
import { useAutoPagination } from '#/lib/query/use-auto-pagination';
import { typedKeys } from '#/lib/utils/objects';

import {
	didOrHandleUriMatches,
	embedViewRecordToPostView,
	getEmbeddedPost,
} from '#/state/cache/finder-utils';
import { registerShadowFinders } from '#/state/cache/registry';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { RQKEY, RQKEY_ROOT } from '#/state/queries/feed/keys';
import { FeedTuner } from '#/state/queries/feed/lib/feed-tuner';
import { useFeedTuners } from '#/state/queries/feed/lib/use-feed-tuners';
import { MIN_POSTS, usePostFeedFetcher } from '#/state/queries/feed/post-feed-fetcher';
import type {
	FeedPage,
	FeedPageUnselected,
	FeedPostSlice,
	FeedPostSliceItem,
} from '#/state/queries/feed/types';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';

type RQPageParam = string | undefined;

export function usePostFeedQuery(
	feedDesc: FeedDescriptor,
	opts?: { enabled?: boolean; ignoreFilterFor?: string },
) {
	const feedTuners = useFeedTuners(feedDesc);
	const moderationOpts = useModerationOpts();
	const { data: preferences } = usePreferencesQuery();
	const enabled = opts?.enabled !== false && !!moderationOpts && !!preferences;
	const { fetchPage } = usePostFeedFetcher(feedDesc);
	const lastRun = useRef<{
		data: InfiniteData<FeedPageUnselected>;
		args: typeof selectArgs;
		result: InfiniteData<FeedPage>;
	} | null>(null);

	// keep the selector stable unless one of its inputs changes.
	const selectArgs = {
		feedTuners,
		moderationOpts,
		ignoreFilterFor: opts?.ignoreFilterFor,
	};

	const query = useInfiniteQuery<FeedPageUnselected, Error, InfiniteData<FeedPage>, QueryKey, RQPageParam>({
		queryKey: RQKEY(feedDesc),
		enabled,
		staleTime: STALE.INFINITY,
		queryFn: ({ pageParam, signal }: { pageParam: RQPageParam; signal: AbortSignal }) =>
			fetchPage(pageParam, signal),
		initialPageParam: undefined,
		getNextPageParam: (lastPage, _allPages, _lastPageParam, allPageParams) => {
			if (!lastPage.cursor || allPageParams.includes(lastPage.cursor)) {
				return undefined;
			}
			return lastPage.cursor;
		},
		select: (data: InfiniteData<FeedPageUnselected, RQPageParam>) => {
			// oxlint-disable-next-line no-shadow -- shadowing is the point: it stops the callback from reading a stale closure copy instead of `selectArgs`
			const { feedTuners, moderationOpts, ignoreFilterFor } = selectArgs;

			const tuner = new FeedTuner(feedTuners);

			const reusedPages: FeedPage[] = [];
			if (lastRun.current) {
				const { data: lastData, args: lastArgs, result: lastResult } = lastRun.current;
				let canReuse = true;
				for (const key of typedKeys(selectArgs)) {
					if (selectArgs[key] !== lastArgs[key]) {
						// reuse is only safe when every selector input is unchanged.
						canReuse = false;
						break;
					}
				}
				if (canReuse) {
					for (let i = 0; i < data.pages.length; i++) {
						if (data.pages[i] && lastData.pages[i] === data.pages[i]) {
							reusedPages.push(lastResult.pages[i]!);
							// keep tuning state aligned with reused pages.
							tuner.tune(lastData.pages[i]!.feed);
							continue;
						}
						break;
					}
				}
			}

			const result = {
				pageParams: data.pageParams,
				pages: [
					...reusedPages,
					...data.pages.slice(reusedPages.length).map((page) => ({
						tuner,
						cursor: page.cursor,
						fetchedAt: page.fetchedAt,
						slices: mapDefined(tuner.tune(page.feed), (slice) => {
							const moderations = slice.items.map((item) => moderatePost(item.post, moderationOpts!));

							for (let i = 0; i < slice.items.length; i++) {
								const isProfileOwnerPost = slice.items[i]!.post.author.did === ignoreFilterFor;

								// profile mutes do not hide content surfaced by the profile owner.
								if (ignoreFilterFor) {
									moderations[i]!.causes = moderations[i]!.causes.filter(
										(cause) =>
											cause.type !== ModerationCauseType.MutedPermanent &&
											cause.type !== ModerationCauseType.MutedTemporary,
									);
								}
								if (
									!isProfileOwnerPost &&
									getDisplayRestrictions(moderations[i]!, DisplayContext.ContentList).filters.length > 0
								) {
									return;
								}
							}

							const feedPostSlice: FeedPostSlice = {
								_reactKey: slice._reactKey,
								_isFeedPostSlice: true,
								isIncompleteThread: slice.isIncompleteThread,
								feedContext: slice.feedContext,
								reqId: slice.reqId,
								reason: slice.reason,
								feedPostUri: slice.feedPostUri,
								items: slice.items.map((item, i) => {
									const feedPostSliceItem: FeedPostSliceItem = {
										_reactKey: `${slice._reactKey}-${i}-${item.post.uri}`,
										uri: item.post.uri,
										post: item.post,
										record: item.record,
										postNumbering: item.postNumbering,
										moderation: moderations[i]!,
										parentAuthor: item.parentAuthor,
										isParentBlocked: item.isParentBlocked,
										isParentNotFound: item.isParentNotFound,
									};
									return feedPostSliceItem;
								}),
							};
							return feedPostSlice;
						}),
					})),
				],
			};
			lastRun.current = { data, result, args: selectArgs };
			return result;
		},
	});

	// fetch more pages when filtering leaves fewer items than requested.
	let itemCount = 0;
	for (const page of query.data?.pages ?? []) {
		for (const slice of page.slices) {
			itemCount += slice.items.length;
		}
	}
	useAutoPagination({ query, itemCount, pageSize: MIN_POSTS });

	return query;
}

// #region shadow finders

function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
	const atUri = parseResourceUri(uri);

	const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPageUnselected>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const item of page.feed) {
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
	const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPageUnselected>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const item of page.feed) {
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
	// prefer the feed post used to open the thread.
	priority: 10,
	findPosts: findAllPostsInQueryData,
	findProfiles: findAllProfilesInQueryData,
});

// #endregion
