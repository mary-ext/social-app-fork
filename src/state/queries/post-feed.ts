import { useEffect, useRef } from 'react';

import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderatePost,
	ModerationCauseType,
	type ModerationDecision,
} from '@atcute/bluesky-moderation';
import type { Client } from '@atcute/client';
import { type Did, parseResourceUri } from '@atcute/lexicons/syntax';

import { mapDefined } from '@mary/array-fns';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { isDocumentVisible } from '#/lib/browser/visibility';
import { toModerationPreferences } from '#/lib/moderation/preferences';
import type { BskyPreferences } from '#/lib/moderation/preferences-types';
import { typedKeys } from '#/lib/utils/objects';

import { registerShadowFinders } from '#/state/cache/registry';
import { STALE } from '#/state/queries';
import { AuthorFeedAPI } from '#/state/queries/feed-api/author';
import { CustomFeedAPI } from '#/state/queries/feed-api/custom';
import { FollowingFeedAPI } from '#/state/queries/feed-api/following';
import { ListFeedAPI } from '#/state/queries/feed-api/list';
import { PostListFeedAPI } from '#/state/queries/feed-api/posts';
import type { FeedAPI } from '#/state/queries/feed-api/types';
import { joinInterestTags } from '#/state/queries/feed-api/utils';
import type { FeedDescriptor } from '#/state/queries/feed-descriptor';
import { FeedTuner } from '#/state/queries/feed-tuner';
import { DEFAULT_LOGGED_OUT_PREFERENCES } from '#/state/queries/preferences/const';
import { getClients, useSession } from '#/state/session';

import { KnownError } from '#/components/PostFeed/PostFeedErrorMessage';

import { useModerationOpts } from '../moderation/moderation-opts';
import { useFeedTuners } from './feed-tuners';
import { usePreferencesQuery } from './preferences';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from './util';

type RQPageParam = { cursor: string | undefined; api: FeedAPI } | undefined;

export const RQKEY_ROOT = 'post-feed';
export function RQKEY(feedDesc: FeedDescriptor) {
	return [RQKEY_ROOT, feedDesc];
}

export interface FeedPostSliceItem {
	_reactKey: string;
	uri: string;
	post: AppBskyFeedDefs.PostView;
	record: AppBskyFeedPost.Main;
	moderation: ModerationDecision;
	parentAuthor?: AppBskyActorDefs.ProfileViewBasic;
	isParentBlocked?: boolean;
	isParentNotFound?: boolean;
}

export interface FeedPostSlice {
	_isFeedPostSlice: boolean;
	_reactKey: string;
	items: FeedPostSliceItem[];
	isIncompleteThread: boolean;
	feedContext: string | undefined;
	reqId: string | undefined;
	feedPostUri: string;
	reason?: AppBskyFeedDefs.FeedViewPost['reason'];
}

export interface FeedPageUnselected {
	api: FeedAPI;
	cursor: string | undefined;
	feed: AppBskyFeedDefs.FeedViewPost[];
	fetchedAt: number;
}

export interface FeedPage {
	api: FeedAPI;
	tuner: FeedTuner;
	cursor: string | undefined;
	slices: FeedPostSlice[];
	fetchedAt: number;
}

/** minimum number of posts required in a single page of results */
const MIN_POSTS = 30;

export function usePostFeedQuery(
	feedDesc: FeedDescriptor,
	opts?: { enabled?: boolean; ignoreFilterFor?: string },
) {
	const feedTuners = useFeedTuners(feedDesc);
	const moderationOpts = useModerationOpts();
	const { data: preferences } = usePreferencesQuery();
	const enabled = opts?.enabled !== false && !!moderationOpts && !!preferences;
	const userInterests = joinInterestTags(preferences);
	const { appview } = getClients();
	const { hasSession } = useSession();
	const lastRun = useRef<{
		data: InfiniteData<FeedPageUnselected>;
		args: typeof selectArgs;
		result: InfiniteData<FeedPage>;
	} | null>(null);

	const fetchLimit = MIN_POSTS;

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
		async queryFn({ pageParam, signal }: { pageParam: RQPageParam; signal: AbortSignal }) {
			const { api, cursor } = pageParam
				? pageParam
				: {
						api: createApi({
							feedDesc,
							appview,
							// these values do not change, so they are not query-key inputs.
							userInterests,
						}),
						cursor: undefined,
					};

			const res = await api.fetch({ cursor, limit: fetchLimit, signal });

			// public feeds must contain at least one post allowed by moderation.
			if (!hasSession) {
				assertSomePostsPassModeration(
					res.feed,
					preferences?.moderationPrefs || DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
				);
			}

			return {
				api,
				cursor: res.cursor,
				feed: res.feed,
				fetchedAt: Date.now(),
			};
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) =>
			lastPage.cursor
				? {
						api: lastPage.api,
						cursor: lastPage.cursor,
					}
				: undefined,
		select: (data: InfiniteData<FeedPageUnselected, RQPageParam>) => {
			// read selector inputs from the stable object to avoid stale closures.
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
						api: page.api,
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
	const lastItemCount = useRef(0);
	const wantedItemCount = useRef(0);
	const autoPaginationAttemptCount = useRef(0);
	useEffect(() => {
		const { data, isLoading, isRefetching, isFetchingNextPage, hasNextPage } = query;
		let itemCount = 0;
		for (const page of data?.pages || []) {
			for (const slice of page.slices) {
				itemCount += slice.items.length;
			}
		}

		if (itemCount !== lastItemCount.current) {
			if (itemCount < lastItemCount.current) {
				wantedItemCount.current = itemCount;
			}
			lastItemCount.current = itemCount;
		}

		if (isLoading || isRefetching) {
			wantedItemCount.current = MIN_POSTS;
		} else if (isFetchingNextPage) {
			if (itemCount > wantedItemCount.current) {
				// account for pages requested by another caller.
				wantedItemCount.current = itemCount + MIN_POSTS;
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

export async function pollLatest(page: FeedPage | undefined) {
	if (!page) {
		return false;
	}
	if (!isDocumentVisible()) {
		return false;
	}

	const post = await page.api.peekLatest();
	if (post) {
		const slices = page.tuner.tune([post], {
			dryRun: true,
		});
		if (slices[0]) {
			return true;
		}
	}

	return false;
}

function createApi({
	feedDesc,
	userInterests,
	appview,
}: {
	feedDesc: FeedDescriptor;
	userInterests?: string;
	appview: Client;
}) {
	switch (feedDesc.type) {
		case 'following': {
			return new FollowingFeedAPI({ appview });
		}
		case 'author': {
			return new AuthorFeedAPI({
				appview,
				feedParams: { actor: feedDesc.did, filter: feedDesc.filter },
			});
		}
		case 'feedgen': {
			return new CustomFeedAPI({
				appview,
				feedParams: { feed: feedDesc.uri },
				userInterests,
			});
		}
		case 'list': {
			return new ListFeedAPI({ appview, feedParams: { list: feedDesc.uri } });
		}
		case 'posts': {
			return new PostListFeedAPI({ appview, feedParams: { uris: feedDesc.uris } });
		}
	}
}

export function* findAllPostsInQueryData(
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

export function* findAllProfilesInQueryData(
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

function assertSomePostsPassModeration(
	feed: AppBskyFeedDefs.FeedViewPost[],
	moderationPrefs: BskyPreferences['moderationPrefs'],
) {
	if (feed.length === 0) {
		return true;
	}

	let somePostsPassModeration = false;

	for (const item of feed) {
		const moderation = moderatePost(item.post, {
			viewerDid: undefined,
			prefs: toModerationPreferences(moderationPrefs),
		});

		if (getDisplayRestrictions(moderation, DisplayContext.ContentList).filters.length === 0) {
			somePostsPassModeration = true;
		}
	}

	if (!somePostsPassModeration) {
		throw new Error(KnownError.FeedSignedInOnly);
	}
}

export function resetProfilePostsQueries(queryClient: QueryClient, did: Did, timeout = 0) {
	setTimeout(() => {
		// reset every author feed filter for this did.
		void queryClient.resetQueries({ queryKey: [RQKEY_ROOT, { type: 'author', did }] });
	}, timeout);
}

registerShadowFinders(RQKEY_ROOT, {
	// prefer the feed post used to open the thread.
	priority: 10,
	findPosts: findAllPostsInQueryData,
	findProfiles: findAllProfilesInQueryData,
});
