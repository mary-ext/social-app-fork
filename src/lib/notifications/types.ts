import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

/** the `feed` values accepted by `app.bsky.notification.getGroupedNotifications`. */
export type GroupedNotificationsFeed = 'all' | 'people-i-follow' | 'conversations' | 'followers' | 'activity';

type ProfileView = AppBskyActorDefs.ProfileViewBasic;
type PostView = AppBskyFeedDefs.PostView;
type GeneratorView = AppBskyFeedDefs.GeneratorView;
type StarterPackView = AppBskyGraphDefs.StarterPackViewBasic;

/** guarantees a primary entry, so rows never have to handle an empty list. */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * @param items items to check
 * @returns whether `items` has at least one entry
 */
export const isNonEmpty = <T>(items: T[]): items is NonEmptyArray<T> => {
	return items.length > 0;
};

/** a parent post that may no longer be viewable; blocked and missing parents are kept rather than dropped. */
export type ParentPost = { type: 'post'; post: PostView } | { type: 'blocked' } | { type: 'notFound' };

interface NotificationBase {
	/** group id from the API, used as the list key. */
	id: string;
	isRead: boolean;
	indexedAt: string;
	/**
	 * total number of underlying notifications, never fewer than the resolved actors or posts. usually larger
	 * than those, since the API only includes views for the newest 10 per group. for subscribed posts it counts
	 * posts, not people.
	 */
	count: number;
}

/** the people in a group of notifications from different actors, e.g. everyone who liked a post. */
export interface ActorGroup {
	/** actors with a profile in `relatedViews`, newest first. the first is the group's primary actor. */
	actors: NonEmptyArray<ProfileView>;
	/**
	 * every actor in the group, newest first, including those without a resolved profile. a superset of the
	 * DIDs in `actors`, so the rest can be loaded on demand. may still be fewer than `count`.
	 */
	actorDids: Did[];
}

interface MultiPost {
	actor: ProfileView;
	posts: NonEmptyArray<PostView>;
}

/**
 * a notification group from `getGroupedNotifications`, with every DID and at-uri resolved against the page's
 * `relatedViews`.
 *
 * views are the original objects from the response, never copies, since post and profile shadows are keyed by
 * object identity.
 */
export type NotificationView =
	| (NotificationBase & ActorGroup & { type: 'like'; post: PostView })
	| (NotificationBase & ActorGroup & { type: 'repost'; post: PostView })
	| (NotificationBase & ActorGroup & { type: 'likeViaRepost'; post: PostView })
	| (NotificationBase & ActorGroup & { type: 'repostViaRepost'; post: PostView })
	| (NotificationBase & MultiPost & { type: 'multiPostLike' })
	| (NotificationBase & MultiPost & { type: 'multiPostRepost' })
	| (NotificationBase & MultiPost & { type: 'multiPostLikeViaRepost' })
	| (NotificationBase & MultiPost & { type: 'multiPostRepostViaRepost' })
	| (NotificationBase &
			ActorGroup & {
				type: 'follow';
				/** only set when every follow in the group came via the same pack. */
				starterPack?: StarterPackView;
			})
	| (NotificationBase & {
			type: 'subscribedPost';
			items: NonEmptyArray<{ actor: ProfileView; post: PostView; parent?: ParentPost }>;
	  })
	| (NotificationBase & ActorGroup & { type: 'generatorLike'; generator: GeneratorView })
	| (NotificationBase & { type: 'reply'; post: PostView; parent: ParentPost })
	| (NotificationBase & { type: 'quote'; post: PostView; parent?: ParentPost })
	| (NotificationBase & { type: 'mention'; post: PostView; parent?: ParentPost })
	| (NotificationBase & { type: 'followBack'; actor: ProfileView; starterPack?: StarterPackView })
	| (NotificationBase & { type: 'verified'; actor: ProfileView })
	| (NotificationBase & { type: 'unverified'; actor: ProfileView })
	| (NotificationBase & { type: 'starterPackJoined'; actor: ProfileView; starterPack: StarterPackView })
	| (NotificationBase & { type: 'contactMatch'; actor: ProfileView });

/** a notification from a group of different people, see `ActorGroup`. */
export type ActorGroupNotification = Extract<NotificationView, ActorGroup>;

const ACTOR_GROUP_TYPES = new Set<NotificationView['type']>([
	'like',
	'repost',
	'likeViaRepost',
	'repostViaRepost',
	'follow',
	'generatorLike',
]);

/**
 * @param notification notification to check
 * @returns whether it comes from a group of different people
 */
export const isActorGroupNotification = (
	notification: NotificationView,
): notification is ActorGroupNotification => {
	return ACTOR_GROUP_TYPES.has(notification.type);
};

/** one page of the grouped notifications query, after hydration. */
export interface NotificationFeedPage {
	cursor: string | undefined;
	/** the server's `seenAt` as of the request. */
	seenAt: string | undefined;
	notifications: NotificationView[];
}
