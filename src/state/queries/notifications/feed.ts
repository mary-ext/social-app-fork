/**
 * cached notifications driven by the unread API.
 *
 * to sync latest data, call `checkUnread()` instead of refetching this query. use `checkUnread({invalidate:
 * true})` to immediately sync latest results.
 */

import { useEffect, useRef } from 'react';

import type { AnyProfileView, AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import {
	type InfiniteData,
	type QueryClient,
	type QueryKey,
	useInfiniteQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { typedKeys } from '#/lib/utils/objects';

import { registerShadowFinders } from '#/state/cache/registry';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { STALE } from '#/state/queries';
import { getClients } from '#/state/session';
import { useHiddenReplyUris } from '#/state/threadgate-hidden-replies';

import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from '../util';
import type { FeedPage } from './types';
import { useUnreadNotificationsApi } from './unread';
import { fetchPage } from './util';

export type { FeedNotification, FeedPage, NotificationType } from './types';

const PAGE_SIZE = 30;

type RQPageParam = string | undefined;

const RQKEY_ROOT = 'notification-feed';
export function RQKEY(filter: 'all' | 'mentions') {
	return [RQKEY_ROOT, filter];
}

export function useNotificationFeedQuery(opts: { enabled?: boolean; filter: 'all' | 'mentions' }) {
	const { appview } = getClients();
	const queryClient = useQueryClient();
	const moderationOpts = useModerationOpts();
	const unreads = useUnreadNotificationsApi();
	const enabled = opts.enabled !== false;
	const filter = opts.filter;
	const hiddenReplyUris = useHiddenReplyUris();

	const selectArgs = {
		moderationOpts,
		hiddenReplyUris,
	};
	const lastRun = useRef<{
		data: InfiniteData<FeedPage>;
		args: typeof selectArgs;
		result: InfiniteData<FeedPage>;
	} | null>(null);

	const query = useInfiniteQuery<FeedPage, Error, InfiniteData<FeedPage>, QueryKey, RQPageParam>({
		queryKey: RQKEY(filter),
		enabled,
		staleTime: STALE.INFINITY,
		async queryFn({ pageParam }: { pageParam: RQPageParam }) {
			let page;
			if (filter === 'all' && !pageParam) {
				// prefer the unread checker's cached first page.
				page = unreads.getCachedUnreadPage();
			}
			if (!page) {
				let reasons: string[] = [];
				if (filter === 'mentions') {
					reasons = ['mention', 'reply', 'quote'];
				}
				const { page: fetchedPage } = await fetchPage({
					appview,
					limit: PAGE_SIZE,
					cursor: pageParam,
					queryClient,
					moderationOpts,
					fetchAdditionalData: true,
					reasons,
				});
				page = fetchedPage;
			}

			if (filter === 'all' && !pageParam) {
				// if the first page has an unread, mark all read
				void unreads.markAllRead();
			}

			return page;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		select: (data: InfiniteData<FeedPage>) => {
			// oxlint-disable-next-line no-shadow -- shadowing is the point: it stops the callback from reading a stale closure copy instead of `selectArgs`
			const { moderationOpts, hiddenReplyUris } = selectArgs;

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
							continue;
						}
						break;
					}
				}
			}

			// the first page's seenAt prevents markAllRead from affecting later pages.
			const seenAt = data.pages[0]?.seenAt || new Date();
			for (const page of data.pages) {
				for (const item of page.items) {
					item.notification.isRead = seenAt > new Date(item.notification.indexedAt);
				}
			}

			const result = {
				...data,
				pages: [
					...reusedPages,
					// oxlint-disable-next-line oxc/no-map-spread -- `Object.assign` would mutate react-query's cache
					...data.pages.slice(reusedPages.length).map((page) => {
						return {
							...page,
							items: page.items
								.filter((item) => {
									const isHiddenReply =
										item.type === 'reply' && item.subjectUri && hiddenReplyUris.has(item.subjectUri);
									return !isHiddenReply;
								})
								.filter((item) => {
									if (item.type === 'reply' || item.type === 'mention' || item.type === 'quote') {
										/*
										 * The `isPostView` check will fail here bc we don't have
										 * a `$type` field on the `subject`. But if the nested
										 * `record` is a post, we know it's a post view.
										 */
										// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- view defs type `record` as `unknown`; the `$type` check below confirms it
										const record = item.subject?.record as AppBskyFeedPost.Main | undefined;
										if (record?.$type === 'app.bsky.feed.post') {
											// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above: a post record on the subject means the subject is a post view
											const mod = moderatePost(item.subject as AppBskyFeedDefs.PostView, moderationOpts!);
											if (getDisplayRestrictions(mod, DisplayContext.ContentList).filters.length > 0) {
												return false;
											}
										}
									}
									return true;
								}),
						};
					}),
				],
			};

			lastRun.current = { data, result, args: selectArgs };

			return result;
		},
	});

	// fetch more pages when filtering leaves fewer items than requested.
	const lastItemCount = useRef(0);
	const wantedItemCount = useRef(0);
	const autoPaginationAttemptCount = useRef(0);
	useEffect(() => {
		const { data, isLoading, isRefetching, isFetchingNextPage, hasNextPage } = query;
		let itemCount = 0;
		for (const page of data?.pages || []) {
			itemCount += page.items.length;
		}

		if (itemCount !== lastItemCount.current) {
			if (itemCount < lastItemCount.current) {
				wantedItemCount.current = itemCount;
			}
			lastItemCount.current = itemCount;
		}

		if (isLoading || isRefetching) {
			wantedItemCount.current = PAGE_SIZE;
		} else if (isFetchingNextPage) {
			if (itemCount > wantedItemCount.current) {
				// account for pages requested by another caller.
				wantedItemCount.current = itemCount + PAGE_SIZE;
			}
		} else if (hasNextPage) {
			if (itemCount < wantedItemCount.current) {
				autoPaginationAttemptCount.current++;
				if (autoPaginationAttemptCount.current < 50 /* fail-safe */) {
					void query.fetchNextPage();
				}
			} else {
				autoPaginationAttemptCount.current = 0;
			}
		}
	}, [query]);

	return query;
}

export function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
	const atUri = parseResourceUri(uri);

	const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPage>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}

		for (const page of queryData.pages) {
			for (const item of page.items) {
				if (item.type !== 'starterpack-joined') {
					if (item.subject && didOrHandleUriMatches(atUri, item.subject)) {
						yield item.subject;
					}
				}

				if (item.subject?.$type === 'app.bsky.feed.defs#postView') {
					const quotedPost = getEmbeddedPost(item.subject?.embed);
					if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
						yield embedViewRecordToPostView(quotedPost);
					}
				}
			}
		}
	}
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AnyProfileView, void> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<FeedPage>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const item of page.items) {
				if (item.notification.author.did === did) {
					yield item.notification.author;
				}
				for (const notification of item.additional ?? []) {
					if (notification.author.did === did) {
						yield notification.author;
					}
				}
				if (item.type !== 'starterpack-joined' && item.subject?.author.did === did) {
					yield item.subject.author;
				}
				if (item.subject?.$type === 'app.bsky.feed.defs#postView') {
					const quotedPost = getEmbeddedPost(item.subject?.embed);
					if (quotedPost?.author.did === did) {
						yield quotedPost.author;
					}
				}
			}
		}
	}
}

registerShadowFinders(RQKEY_ROOT, {
	findPosts: findAllPostsInQueryData,
	findProfiles: findAllProfilesInQueryData,
});
