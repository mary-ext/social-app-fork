import type {
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyGraphDefs,
	AppBskyNotificationGetGroupedNotifications,
} from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import { mapDefined } from '@mary-ext/array-fns';

import {
	type ActorGroup,
	isActorGroupNotification,
	isNonEmpty,
	type NonEmptyArray,
	type NotificationView,
	type ParentPost,
} from '#/lib/notifications/types';

type Output = AppBskyNotificationGetGroupedNotifications.$output;
type Group = AppBskyNotificationGetGroupedNotifications.Group;
type ProfileView = AppBskyActorDefs.ProfileViewBasic;
type PostView = AppBskyFeedDefs.PostView;

/** lookups built from a page's `relatedViews`, plus the viewer to exclude from actor lists. */
interface Context {
	viewerDid: Did | undefined;
	profiles: Map<string, ProfileView>;
	/** every post-like view by uri, including blocked and not-found posts. */
	posts: Map<string, ParentPost>;
	generators: Map<string, AppBskyFeedDefs.GeneratorView>;
	starterPacks: Map<string, AppBskyGraphDefs.StarterPackViewBasic>;
}

/**
 * resolves every DID and at-uri in a `getGroupedNotifications` response against its `relatedViews`, dropping
 * groups that can't be rendered (unknown kinds, missing subjects, no resolvable actors).
 *
 * @param data the response body
 * @param viewerDid the signed-in account, never listed as an actor
 * @returns the hydrated notifications, and when the newest group (dropped or not) was indexed
 */
export const hydratePage = (
	data: Output,
	viewerDid: Did | undefined,
): { notifications: NotificationView[]; newestAt: number | undefined } => {
	const ctx = createContext(data.relatedViews, viewerDid);
	const notifications = mapDefined(data.groups, (group) => {
		const notification = hydrateGroup(group, ctx);
		if (notification) {
			// the notification is newly built, so this mutates nothing shared
			notification.count = Math.max(notification.count, getResolvedCount(notification));
		}
		return notification;
	});
	return { notifications, newestAt: getNewestAt(data.groups) };
};

/** how many actors or posts the notification resolved, which its `count` can't be lower than. */
const getResolvedCount = (notification: NotificationView): number => {
	if (isActorGroupNotification(notification)) {
		return notification.actorDids.length;
	}
	switch (notification.type) {
		case 'multiPostLike':
		case 'multiPostRepost':
		case 'multiPostLikeViaRepost':
		case 'multiPostRepostViaRepost': {
			return notification.posts.length;
		}
		case 'subscribedPost': {
			return notification.items.length;
		}
	}
	return 1;
};

const getNewestAt = (groups: Group[]): number | undefined => {
	let newestAt: number | undefined;
	for (const group of groups) {
		const indexedAt = Date.parse(group.indexedAt);
		if (indexedAt > (newestAt ?? -Infinity)) {
			newestAt = indexedAt;
		}
	}
	return newestAt;
};

const createContext = (relatedViews: Output['relatedViews'], viewerDid: Did | undefined): Context => {
	const ctx: Context = {
		viewerDid,
		profiles: new Map(),
		posts: new Map(),
		generators: new Map(),
		starterPacks: new Map(),
	};
	for (const view of relatedViews ?? []) {
		switch (view.$type) {
			case 'app.bsky.actor.defs#profileViewBasic': {
				ctx.profiles.set(view.did, view);
				break;
			}
			case 'app.bsky.feed.defs#postView': {
				ctx.posts.set(view.uri, { type: 'post', post: view });
				break;
			}
			case 'app.bsky.feed.defs#blockedPost': {
				ctx.posts.set(view.uri, { type: 'blocked' });
				break;
			}
			case 'app.bsky.feed.defs#notFoundPost': {
				ctx.posts.set(view.uri, { type: 'notFound' });
				break;
			}
			case 'app.bsky.feed.defs#generatorView': {
				ctx.generators.set(view.uri, view);
				break;
			}
			case 'app.bsky.graph.defs#starterPackViewBasic': {
				ctx.starterPacks.set(view.uri, view);
				break;
			}
		}
	}
	return ctx;
};

const hydrateGroup = (group: Group, ctx: Context): NotificationView | undefined => {
	const { kind } = group;
	const base = {
		id: group.id,
		isRead: group.isRead,
		indexedAt: group.indexedAt,
		count: group.count,
	};

	switch (kind.$type) {
		case 'app.bsky.notification.getGroupedNotifications#likeGroup':
		case 'app.bsky.notification.getGroupedNotifications#repostGroup': {
			const post = resolvePost(kind.post, ctx);
			const actors = resolveActorGroup(kind.items, ctx);
			if (!post || !actors) {
				return;
			}
			const type =
				kind.$type === 'app.bsky.notification.getGroupedNotifications#likeGroup' ? 'like' : 'repost';
			return { ...base, type, post, ...actors };
		}
		case 'app.bsky.notification.getGroupedNotifications#likeViaRepostGroup':
		case 'app.bsky.notification.getGroupedNotifications#repostViaRepostGroup': {
			const post = resolvePost(kind.post, ctx);
			const actors = resolveActorGroup(kind.items, ctx);
			if (!post || !actors) {
				return;
			}
			const type =
				kind.$type === 'app.bsky.notification.getGroupedNotifications#likeViaRepostGroup'
					? 'likeViaRepost'
					: 'repostViaRepost';
			return { ...base, type, post, ...actors };
		}
		case 'app.bsky.notification.getGroupedNotifications#multiPostLikeGroup': {
			const multi = resolveMultiPost(kind, ctx);
			return multi && { ...base, type: 'multiPostLike', ...multi };
		}
		case 'app.bsky.notification.getGroupedNotifications#multiPostRepostGroup': {
			const multi = resolveMultiPost(kind, ctx);
			return multi && { ...base, type: 'multiPostRepost', ...multi };
		}
		case 'app.bsky.notification.getGroupedNotifications#multiPostLikeViaRepostGroup': {
			const multi = resolveMultiPost(kind, ctx);
			return multi && { ...base, type: 'multiPostLikeViaRepost', ...multi };
		}
		case 'app.bsky.notification.getGroupedNotifications#multiPostRepostViaRepostGroup': {
			const multi = resolveMultiPost(kind, ctx);
			return multi && { ...base, type: 'multiPostRepostViaRepost', ...multi };
		}
		case 'app.bsky.notification.getGroupedNotifications#followGroup': {
			const actors = resolveActorGroup(kind.items, ctx);
			if (!actors) {
				return;
			}
			// "via <pack>" would be wrong for some actors unless every follow came via the same one
			const packUri = kind.items[0]?.starterPack;
			const starterPack =
				packUri && kind.items.every((item) => item.starterPack === packUri)
					? ctx.starterPacks.get(packUri)
					: undefined;
			return { ...base, type: 'follow', ...actors, starterPack };
		}
		case 'app.bsky.notification.getGroupedNotifications#subscribedPostGroup': {
			const items = mapDefined(kind.items, (item) => {
				const actor = resolveActor(item.actor, ctx);
				const post = resolvePost(item.post, ctx);
				if (!actor || !post) {
					return;
				}
				return { actor, post, parent: item.parent ? resolveParent(item.parent, ctx) : undefined };
			});
			if (!isNonEmpty(items)) {
				return;
			}
			return { ...base, type: 'subscribedPost', items };
		}
		case 'app.bsky.notification.getGroupedNotifications#generatorLikeGroup': {
			const generator = ctx.generators.get(kind.generator);
			const actors = resolveActorGroup(kind.items, ctx);
			if (!generator || !actors) {
				return;
			}
			return { ...base, type: 'generatorLike', generator, ...actors };
		}
		case 'app.bsky.notification.getGroupedNotifications#replyNotification': {
			const post = resolvePost(kind.post, ctx);
			if (!post) {
				return;
			}
			return { ...base, type: 'reply', post, parent: resolveParent(kind.parent, ctx) };
		}
		case 'app.bsky.notification.getGroupedNotifications#quoteNotification':
		case 'app.bsky.notification.getGroupedNotifications#mentionNotification': {
			const post = resolvePost(kind.post, ctx);
			if (!post) {
				return;
			}
			const type =
				kind.$type === 'app.bsky.notification.getGroupedNotifications#quoteNotification'
					? 'quote'
					: 'mention';
			const parent = kind.parent ? resolveParent(kind.parent, ctx) : undefined;
			return { ...base, type, post, parent };
		}
		case 'app.bsky.notification.getGroupedNotifications#followBackNotification': {
			const actor = resolveActor(kind.actor, ctx);
			if (!actor) {
				return;
			}
			const starterPack = kind.starterPack ? ctx.starterPacks.get(kind.starterPack) : undefined;
			return { ...base, type: 'followBack', actor, starterPack };
		}
		case 'app.bsky.notification.getGroupedNotifications#verifiedNotification':
		case 'app.bsky.notification.getGroupedNotifications#unverifiedNotification': {
			const actor = resolveActor(kind.actor, ctx);
			if (!actor) {
				return;
			}
			const type =
				kind.$type === 'app.bsky.notification.getGroupedNotifications#verifiedNotification'
					? 'verified'
					: 'unverified';
			return { ...base, type, actor };
		}
		case 'app.bsky.notification.getGroupedNotifications#starterPackJoinedNotification': {
			const actor = resolveActor(kind.actor, ctx);
			const starterPack = ctx.starterPacks.get(kind.starterPack);
			if (!actor || !starterPack) {
				return;
			}
			return { ...base, type: 'starterPackJoined', actor, starterPack };
		}
		case 'app.bsky.notification.getGroupedNotifications#contactMatchNotification': {
			const actor = resolveActor(kind.actor, ctx);
			if (!actor) {
				return;
			}
			return { ...base, type: 'contactMatch', actor };
		}
	}

	// unknown kind, which the lexicon tells clients to ignore
	return undefined;
};

/** the viewer is treated as unresolved, so self-likes and the like never show up as actors. */
const resolveActor = (did: string, ctx: Context): ProfileView | undefined => {
	if (did === ctx.viewerDid) {
		return undefined;
	}
	return ctx.profiles.get(did);
};

const resolveMultiPost = (
	kind: { actor: string; items: { post: string }[] },
	ctx: Context,
): { actor: ProfileView; posts: NonEmptyArray<PostView> } | undefined => {
	const actor = resolveActor(kind.actor, ctx);
	const posts = mapDefined(kind.items, (item) => resolvePost(item.post, ctx));
	if (!actor || !isNonEmpty(posts)) {
		return;
	}
	return { actor, posts };
};

/** keeps every DID alongside the resolved profiles so the rest can be loaded later. */
const resolveActorGroup = (items: { actor: Did }[], ctx: Context): ActorGroup | undefined => {
	const actorDids: Did[] = [];
	const actors: ProfileView[] = [];
	const seen = new Set<string>();
	for (const { actor: did } of items) {
		if (seen.has(did) || did === ctx.viewerDid) {
			continue;
		}
		seen.add(did);
		actorDids.push(did);
		const actor = ctx.profiles.get(did);
		if (actor) {
			actors.push(actor);
		}
	}
	if (!isNonEmpty(actors)) {
		return;
	}
	return { actors, actorDids };
};

/** blocked and not-found posts resolve to `undefined`. */
const resolvePost = (uri: string, ctx: Context): PostView | undefined => {
	const entry = ctx.posts.get(uri);
	return entry?.type === 'post' ? entry.post : undefined;
};

/** a uri with no view at all is treated as not found, since there's nothing to render either way. */
const resolveParent = (uri: string, ctx: Context): ParentPost => {
	return ctx.posts.get(uri) ?? { type: 'notFound' };
};
