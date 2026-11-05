/**
 * grouped notification feeds, from `app.bsky.notification.getGroupedNotifications`.
 *
 * to sync latest data, call `checkUnread()` instead of refetching this query. use `checkUnread({invalidate:
 * true})` to immediately sync latest results.
 */

import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { mapDefined } from '@mary-ext/array-fns';

import { type InfiniteData, type QueryClient, useInfiniteQuery } from '@tanstack/react-query';

import {
	type ActorGroupNotification,
	type GroupedNotificationsFeed,
	isActorGroupNotification,
	type NotificationFeedPage,
	type NotificationView,
} from '#/lib/notifications/types';
import { STALE } from '#/lib/query/const';
import { useAutoPagination } from '#/lib/query/use-auto-pagination';

import {
	didOrHandleUriMatches,
	embedViewRecordToPostView,
	getEmbeddedPost,
} from '#/state/cache/finder-utils';
import { registerShadowFinders } from '#/state/cache/registry';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useUnreadNotificationsApi } from '#/state/notifications/unread';
import {
	NOTIFICATION_FEED_RQKEY_ROOT,
	NOTIFICATION_GROUP_ACTORS_RQKEY_ROOT,
	notificationFeedQueryKey,
	notificationGroupActorsQueryKey,
} from '#/state/queries/notifications/keys';
import {
	createGroupActorsPage,
	getNextActorDids,
	getUnresolvedActorDids,
	type GroupActorsPage,
	selectLoadedActors,
} from '#/state/queries/notifications/lib/group-actors';
import { hydratePage } from '#/state/queries/notifications/lib/hydrate';
import {
	moderateNotification,
	type NotificationModerationArgs,
} from '#/state/queries/notifications/lib/moderate';
import { getClients, useSession } from '#/state/session';
import { useHiddenReplyUris } from '#/state/threadgate-hidden-replies';

type PostView = AppBskyFeedDefs.PostView;

const PAGE_SIZE = 30;

/** how many pages in a row can come back empty before the feed is treated as finished. */
const MAX_EMPTY_PAGES = 5;

/**
 * how far before the request a load can't be sure it has shown everything: the server leaves out the last few
 * seconds, and clocks can disagree.
 */
const MARK_READ_SAFETY_WINDOW_MS = 10_000;

// #region feed query

/**
 * @param opts.feed which grouped feed to load
 * @param opts.enabled whether to fetch
 * @returns pages of hydrated, moderated notifications. never goes stale on its own.
 */
export function useNotificationFeedQuery({
	feed,
	enabled,
}: {
	feed: GroupedNotificationsFeed;
	enabled: boolean;
}) {
	const { appview } = getClients();
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const unreads = useUnreadNotificationsApi();
	const hiddenReplyUris = useHiddenReplyUris();
	const viewerDid = currentAccount?.did;

	const query = useInfiniteQuery({
		queryKey: notificationFeedQueryKey(feed),
		// wait for moderation, so unmoderated rows never flash up
		enabled: enabled && !!moderationOpts,
		staleTime: STALE.INFINITY,
		async queryFn({ pageParam, signal }): Promise<NotificationFeedPage> {
			const requestedAt = Date.now();
			const data = await ok(
				appview.get('app.bsky.notification.getGroupedNotifications', {
					signal,
					params: { feed, limit: PAGE_SIZE, cursor: pageParam },
				}),
			);
			const { notifications, newestAt } = hydratePage(data, viewerDid);

			if (feed === 'all' && !pageParam) {
				// mark up to the newest notification shown, or a little before the request: anything older that
				// the load left out was filtered by the server and would otherwise stay unread forever
				const seenAt = Math.max(newestAt ?? -Infinity, requestedAt - MARK_READ_SAFETY_WINDOW_MS);
				void unreads.markAllRead(new Date(seenAt));
			}

			return { cursor: data.cursor, seenAt: data.seenAt, notifications };
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (_lastPage, pages, _lastPageParam, allPageParams) => {
			const cursor = getNextCursor(pages);
			return cursor !== undefined && !allPageParams.includes(cursor) ? cursor : undefined;
		},
		select: (data) => selectNotifications(data, { moderationOpts, hiddenReplyUris }),
	});

	// fetch more pages when moderation leaves fewer items than requested
	const itemCount = query.data?.pages.reduce((count, page) => count + page.notifications.length, 0) ?? 0;
	useAutoPagination({ query, itemCount, pageSize: PAGE_SIZE });

	return query;
}

/**
 * the server can keep returning a cursor for pages whose groups all get dropped while hydrating. giving up
 * after a run of empty pages keeps the end of the list from asking forever.
 */
const getNextCursor = (pages: NotificationFeedPage[]): string | undefined => {
	let emptyPages = 0;
	for (let i = pages.length - 1; i >= 0; i--) {
		if (pages[i]!.notifications.length > 0) {
			break;
		}
		emptyPages++;
	}
	if (emptyPages >= MAX_EMPTY_PAGES) {
		return undefined;
	}
	return pages.at(-1)?.cursor;
};

interface SelectArgs extends NotificationModerationArgs {
	/** notifications indexed after this are tinted as unread. */
	seenAtMs: number | undefined;
}

// pages are immutable once fetched, so only new pages (or changed args) need moderating again
const selectCache = new WeakMap<
	NotificationFeedPage,
	{ args: SelectArgs; notifications: NotificationView[] }
>();

const selectNotifications = (
	data: InfiniteData<NotificationFeedPage, string | undefined>,
	moderationArgs: NotificationModerationArgs,
): InfiniteData<NotificationFeedPage, string | undefined> => {
	// the first page's `seenAt` predates its own mark-read, and keeps later pages tinted the same way
	const firstSeenAt = data.pages[0]?.seenAt;
	const args: SelectArgs = {
		...moderationArgs,
		seenAtMs: firstSeenAt ? Date.parse(firstSeenAt) : undefined,
	};

	const seenIds = new Set<string>();
	return {
		...data,
		pages: data.pages.map((page) => {
			let cached = selectCache.get(page);
			if (
				!cached ||
				cached.args.moderationOpts !== args.moderationOpts ||
				cached.args.hiddenReplyUris !== args.hiddenReplyUris ||
				cached.args.seenAtMs !== args.seenAtMs
			) {
				cached = {
					args,
					notifications: mapDefined(page.notifications, (notification) =>
						selectNotification(notification, args),
					),
				};
				selectCache.set(page, cached);
			}
			return {
				...page,
				// pages can overlap if new notifications arrive while paginating
				notifications: cached.notifications.filter((notification) => {
					if (seenIds.has(notification.id)) {
						return false;
					}
					seenIds.add(notification.id);
					return true;
				}),
			};
		}),
	};
};

const selectNotification = (
	notification: NotificationView,
	args: SelectArgs,
): NotificationView | undefined => {
	const moderated = moderateNotification(notification, args);
	if (!moderated || args.seenAtMs === undefined || Number.isNaN(args.seenAtMs)) {
		return moderated;
	}
	const isRead = Date.parse(moderated.indexedAt) <= args.seenAtMs;
	return isRead === moderated.isRead ? moderated : { ...moderated, isRead };
};

// #endregion

// #region group actors query

/**
 * the actors in a grouped notification beyond the profiles it resolved, loaded a page at a time for "show
 * more". nothing loads until `fetchNextPage` is called.
 *
 * @param group the grouped notification
 * @returns the loaded, moderated `actors`, and whether any are left to request
 */
export function useGroupActorsQuery(group: ActorGroupNotification) {
	const { appview } = getClients();
	const moderationOpts = useModerationOpts();
	const unresolvedDids = getUnresolvedActorDids(group);

	const { data, isFetching, fetchNextPage } = useInfiniteQuery({
		queryKey: notificationGroupActorsQueryKey(group.id),
		// even the first page waits for `fetchNextPage`
		enabled: false,
		staleTime: STALE.INFINITY,
		async queryFn({ pageParam, signal }): Promise<GroupActorsPage> {
			const res = await ok(
				appview.get('app.bsky.actor.getProfiles', { signal, params: { actors: pageParam } }),
			);
			return createGroupActorsPage(pageParam, res.profiles);
		},
		initialPageParam: getNextActorDids(unresolvedDids, []),
		getNextPageParam: (_lastPage, pages): Did[] | undefined => {
			const dids = getNextActorDids(unresolvedDids, pages);
			return dids.length > 0 ? dids : undefined;
		},
	});

	const pages = data?.pages ?? [];
	return {
		actors: selectLoadedActors(pages, unresolvedDids, moderationOpts),
		hasMore: getNextActorDids(unresolvedDids, pages).length > 0,
		isFetching,
		fetchNextPage,
	};
}

// #endregion

// #region shadow finders

function* postsInNotification(notification: NotificationView): Generator<PostView, void> {
	switch (notification.type) {
		case 'like':
		case 'repost':
		case 'likeViaRepost':
		case 'repostViaRepost': {
			yield notification.post;
			break;
		}
		case 'reply':
		case 'quote':
		case 'mention': {
			yield notification.post;
			if (notification.parent?.type === 'post') {
				yield notification.parent.post;
			}
			break;
		}
		case 'multiPostLike':
		case 'multiPostRepost':
		case 'multiPostLikeViaRepost':
		case 'multiPostRepostViaRepost': {
			yield* notification.posts;
			break;
		}
		case 'subscribedPost': {
			for (const item of notification.items) {
				yield item.post;
				if (item.parent?.type === 'post') {
					yield item.parent.post;
				}
			}
			break;
		}
	}
}

/** excludes post authors, see `postsInNotification`. */
function* actorsInNotification(notification: NotificationView): Generator<AnyProfileView, void> {
	if (isActorGroupNotification(notification)) {
		yield* notification.actors;
		return;
	}
	switch (notification.type) {
		case 'multiPostLike':
		case 'multiPostRepost':
		case 'multiPostLikeViaRepost':
		case 'multiPostRepostViaRepost':
		case 'followBack':
		case 'verified':
		case 'unverified':
		case 'starterPackJoined':
		case 'contactMatch': {
			yield notification.actor;
			break;
		}
		case 'subscribedPost': {
			for (const item of notification.items) {
				yield item.actor;
			}
			break;
		}
	}
}

function* cachedNotifications(queryClient: QueryClient): Generator<NotificationView, void> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<NotificationFeedPage>>({
		queryKey: [NOTIFICATION_FEED_RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		for (const page of queryData?.pages ?? []) {
			yield* page.notifications;
		}
	}
}

function* findAllPostsInQueryData(queryClient: QueryClient, uri: string): Generator<PostView, void> {
	const atUri = parseResourceUri(uri);
	for (const notification of cachedNotifications(queryClient)) {
		for (const post of postsInNotification(notification)) {
			if (didOrHandleUriMatches(atUri, post)) {
				yield post;
			}
			const quotedPost = getEmbeddedPost(post.embed);
			if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
				yield embedViewRecordToPostView(quotedPost);
			}
		}
	}
}

function* findAllProfilesInQueryData(queryClient: QueryClient, did: string): Generator<AnyProfileView, void> {
	for (const notification of cachedNotifications(queryClient)) {
		for (const actor of actorsInNotification(notification)) {
			if (actor.did === did) {
				yield actor;
			}
		}
		for (const post of postsInNotification(notification)) {
			if (post.author.did === did) {
				yield post.author;
			}
			const quotedPost = getEmbeddedPost(post.embed);
			if (quotedPost?.author.did === did) {
				yield quotedPost.author;
			}
		}
	}

	// actors loaded by "show more", so their follow buttons update too
	const groupActorsDatas = queryClient.getQueriesData<InfiniteData<GroupActorsPage>>({
		queryKey: [NOTIFICATION_GROUP_ACTORS_RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of groupActorsDatas) {
		for (const page of queryData?.pages ?? []) {
			for (const profile of page.profiles) {
				if (profile.did === did) {
					yield profile;
				}
			}
		}
	}
}

registerShadowFinders(NOTIFICATION_FEED_RQKEY_ROOT, {
	// prefer fresh notification engagement counts.
	priority: 20,
	findPosts: findAllPostsInQueryData,
	findProfiles: findAllProfilesInQueryData,
});

// #endregion
