import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';

import type {
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyFeedGetActorLikes,
	AppBskyFeedGetAuthorFeed,
	AppBskyFeedGetFeed,
	AppBskyFeedGetListFeed,
	AppBskyFeedGetPosts,
	AppBskyFeedPost,
} from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderatePost,
	ModerationCauseType,
	type ModerationDecision,
} from '@atcute/bluesky-moderation';
import type { Client } from '@atcute/client';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { FeedTuner } from '#/lib/api/feed-manip';
import { AuthorFeedAPI } from '#/lib/api/feed/author';
import { CustomFeedAPI } from '#/lib/api/feed/custom';
import { FollowingFeedAPI } from '#/lib/api/feed/following';
import { LikesFeedAPI } from '#/lib/api/feed/likes';
import { ListFeedAPI } from '#/lib/api/feed/list';
import { PostListFeedAPI } from '#/lib/api/feed/posts';
import type { FeedAPI } from '#/lib/api/feed/types';
import { aggregateUserInterests } from '#/lib/api/feed/utils';
import { DISCOVER_FEED_URI } from '#/lib/constants';
import type { BskyPreferences } from '#/lib/moderation/preferences-types';
import { toModerationPreferences } from '#/lib/moderation/prefs';

import { registerShadowFinders } from '#/state/cache/registry';
import { STALE } from '#/state/queries';
import { DEFAULT_LOGGED_OUT_PREFERENCES } from '#/state/queries/preferences/const';
import { useClients, useSession } from '#/state/session';
import * as userActionHistory from '#/state/userActionHistory';

import { logger } from '#/logger';

import { KnownError } from '#/view/com/posts/PostFeedErrorMessage';

import { useFeedTuners } from '../preferences/feed-tuners';
import { useModerationOpts } from '../preferences/moderation-opts';
import { usePreferencesQuery } from './preferences';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from './util';

type ActorDid = string;
export type AuthorFilter =
	| 'posts_with_replies'
	| 'posts_no_replies'
	| 'posts_and_author_threads'
	| 'posts_with_media'
	| 'posts_with_video';
type FeedUri = string;
type ListUri = string;
type PostsUriList = string;

export type FeedDescriptor =
	| 'following'
	| `author|${ActorDid}|${AuthorFilter}`
	| `feedgen|${FeedUri}`
	| `likes|${ActorDid}`
	| `list|${ListUri}`
	| `posts|${PostsUriList}`;

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
	reason?: AppBskyFeedDefs.ReasonRepost | AppBskyFeedDefs.ReasonPin;
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
	/** awaits Active Assistant (AA) state to prevent flash of unstyled content (FOUC). */
	const enabled = opts?.enabled !== false && Boolean(moderationOpts) && Boolean(preferences);
	const userInterests = aggregateUserInterests(preferences);
	const { appview } = useClients();
	const { hasSession } = useSession();
	const lastRun = useRef<{
		data: InfiniteData<FeedPageUnselected>;
		args: typeof selectArgs;
		result: InfiniteData<FeedPage>;
	} | null>(null);
	const isDiscover = feedDesc.includes(DISCOVER_FEED_URI);

	/** number of posts to fetch in a single request */
	const fetchLimit = MIN_POSTS;

	// Make sure this doesn't invalidate unless really needed.
	const selectArgs = useMemo(
		() => ({
			feedTuners,
			moderationOpts,
			ignoreFilterFor: opts?.ignoreFilterFor,
			isDiscover,
		}),
		[feedTuners, moderationOpts, opts?.ignoreFilterFor, isDiscover],
	);

	const query = useInfiniteQuery<FeedPageUnselected, Error, InfiniteData<FeedPage>, QueryKey, RQPageParam>({
		enabled,
		staleTime: STALE.INFINITY,
		queryKey: RQKEY(feedDesc),
		async queryFn({ pageParam }: { pageParam: RQPageParam }) {
			logger.debug('usePostFeedQuery', { feedDesc, cursor: pageParam?.cursor });
			const { api, cursor } = pageParam
				? pageParam
				: {
						api: createApi({
							feedDesc,
							appview,
							// Not in the query key because they don't change:
							userInterests,
						}),
						cursor: undefined,
					};

			const res = await api.fetch({ cursor, limit: fetchLimit });

			/*
			 * If this is a public view, we need to check if posts fail moderation.
			 * If all fail, we throw an error. If only some fail, we continue and let
			 * moderations happen later, which results in some posts being shown and
			 * some not.
			 */
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
		select: useCallback(
			(data: InfiniteData<FeedPageUnselected, RQPageParam>) => {
				// If the selection depends on some data, that data should
				// be included in the selectArgs object and read here.
				// oxlint-disable-next-line no-shadow -- shadowing is the point: it stops the callback from reading a stale closure copy instead of `selectArgs`
				const { feedTuners, moderationOpts, ignoreFilterFor, isDiscover } = selectArgs;

				const tuner = new FeedTuner(feedTuners);

				// Keep track of the last run and whether we can reuse
				// some already selected pages from there.
				const reusedPages: FeedPage[] = [];
				if (lastRun.current) {
					const { data: lastData, args: lastArgs, result: lastResult } = lastRun.current;
					let canReuse = true;
					for (const key of Object.keys(selectArgs) as (keyof typeof selectArgs)[]) {
						if (selectArgs[key] !== lastArgs[key]) {
							// Can't do reuse anything if any input has changed.
							canReuse = false;
							break;
						}
					}
					if (canReuse) {
						for (let i = 0; i < data.pages.length; i++) {
							if (data.pages[i] && lastData.pages[i] === data.pages[i]) {
								reusedPages.push(lastResult.pages[i]!);
								// Keep the tuner in sync so that the end result is deterministic.
								tuner.tune(lastData.pages[i]!.feed);
								continue;
							}
							// Stop as soon as pages stop matching up.
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
							slices: tuner
								.tune(page.feed)
								.map((slice) => {
									const moderations = slice.items.map((item) => moderatePost(item.post, moderationOpts!));

									// apply moderation filter
									const isProfileFeed = Boolean(ignoreFilterFor);
									for (let i = 0; i < slice.items.length; i++) {
										const isProfileOwnerPost = slice.items[i]!.post.author.did === ignoreFilterFor;

										// on a profile, mutes shouldn't hide reposts/replies/likes the account
										// chose to surface; blocks and labels still apply to non-owner content
										if (isProfileFeed) {
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
											return undefined;
										}
									}

									if (isDiscover) {
										userActionHistory.seen(
											slice.items.map((item) => ({
												feedContext: slice.feedContext,
												reqId: slice.reqId,
												likeCount: item.post.likeCount ?? 0,
												repostCount: item.post.repostCount ?? 0,
												replyCount: item.post.replyCount ?? 0,
												isFollowedBy: Boolean(item.post.author.viewer?.followedBy),
												uri: item.post.uri,
											})),
										);
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
								})
								.filter((n): n is FeedPostSlice => !!n),
						})),
					],
				};
				// Save for memoization.
				lastRun.current = { data, result, args: selectArgs };
				return result;
			},
			[selectArgs /* Don't change. Everything needs to go into selectArgs. */],
		),
	});

	// The server may end up returning an empty page, a page with too few items,
	// or a page with items that end up getting filtered out. When we fetch pages,
	// we'll keep track of how many items we actually hope to see. If the server
	// doesn't return enough items, we're going to continue asking for more items.
	const lastItemCount = useRef(0);
	const wantedItemCount = useRef(0);
	const autoPaginationAttemptCount = useRef(0);
	useEffect(() => {
		const { data, isLoading, isRefetching, isFetchingNextPage, hasNextPage } = query;
		// Count the items that we already have.
		let itemCount = 0;
		for (const page of data?.pages || []) {
			for (const slice of page.slices) {
				itemCount += slice.items.length;
			}
		}

		// If items got truncated, reset the state we're tracking below.
		if (itemCount !== lastItemCount.current) {
			if (itemCount < lastItemCount.current) {
				wantedItemCount.current = itemCount;
			}
			lastItemCount.current = itemCount;
		}

		// Now track how many items we really want, and fetch more if needed.
		if (isLoading || isRefetching) {
			// During the initial fetch, we want to get an entire page's worth of items.
			wantedItemCount.current = MIN_POSTS;
		} else if (isFetchingNextPage) {
			if (itemCount > wantedItemCount.current) {
				// We have more items than wantedItemCount, so wantedItemCount must be out of date.
				// Some other code must have called fetchNextPage(), for example, from onEndReached.
				// Adjust the wantedItemCount to reflect that we want one more full page of items.
				wantedItemCount.current = itemCount + MIN_POSTS;
			}
		} else if (hasNextPage) {
			// At this point we're not fetching anymore, so it's time to make a decision.
			// If we didn't receive enough items from the server, paginate again until we do.
			if (itemCount < wantedItemCount.current) {
				autoPaginationAttemptCount.current++;
				if (autoPaginationAttemptCount.current < 50 /* failsafe */) {
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
	if (AppState.currentState !== 'active') {
		return;
	}

	logger.debug('usePostFeedQuery: pollLatest');
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
	if (feedDesc === 'following') {
		return new FollowingFeedAPI({ appview });
	} else if (feedDesc.startsWith('author')) {
		const [__, actor, filter] = feedDesc.split('|') as [string, string, string];
		return new AuthorFeedAPI({ appview, feedParams: { actor, filter } as AppBskyFeedGetAuthorFeed.$params });
	} else if (feedDesc.startsWith('likes')) {
		const [__, actor] = feedDesc.split('|') as [string, string];
		return new LikesFeedAPI({ appview, feedParams: { actor } as AppBskyFeedGetActorLikes.$params });
	} else if (feedDesc.startsWith('feedgen')) {
		const [__, feed] = feedDesc.split('|') as [string, string];
		return new CustomFeedAPI({
			appview,
			feedParams: { feed } as AppBskyFeedGetFeed.$params,
			userInterests,
		});
	} else if (feedDesc.startsWith('list')) {
		const [__, list] = feedDesc.split('|') as [string, string];
		return new ListFeedAPI({ appview, feedParams: { list } as AppBskyFeedGetListFeed.$params });
	} else if (feedDesc.startsWith('posts')) {
		const [__, uriList] = feedDesc.split('|') as [string, string];
		return new PostListFeedAPI({
			appview,
			feedParams: { uris: uriList.split(',') } as AppBskyFeedGetPosts.$params,
		});
	} else {
		// shouldnt happen
		return new FollowingFeedAPI({ appview });
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
	// no posts in this feed
	if (feed.length === 0) return true;

	// assume false
	let somePostsPassModeration = false;

	for (const item of feed) {
		const moderation = moderatePost(item.post, {
			viewerDid: undefined,
			prefs: toModerationPreferences(moderationPrefs),
		});

		if (getDisplayRestrictions(moderation, DisplayContext.ContentList).filters.length === 0) {
			// we have a sfw post
			somePostsPassModeration = true;
		}
	}

	if (!somePostsPassModeration) {
		throw new Error(KnownError.FeedSignedInOnly);
	}
}

export function resetProfilePostsQueries(queryClient: QueryClient, did: string, timeout = 0) {
	setTimeout(() => {
		void queryClient.resetQueries({
			predicate: (query) => query.queryKey[0] === RQKEY_ROOT && (query.queryKey[1] as string)?.includes(did),
		});
	}, timeout);
}

registerShadowFinders(RQKEY_ROOT, {
	findPosts: findAllPostsInQueryData,
	findProfiles: findAllProfilesInQueryData,
});
