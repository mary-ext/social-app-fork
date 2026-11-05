import type { AppBskyActorDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderatePost,
	moderateProfile,
	type ModerationDecision,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { getPostRecord } from '#/lib/api/record-casts';
import { labelIsHideableOffense } from '#/lib/moderation/causes';
import { hasMutedWord } from '#/lib/moderation/muted-words';
import { isNonEmpty, type NotificationView } from '#/lib/notifications/types';

// actors loaded with "show more" come from `getProfiles`, which returns detailed views
type ProfileView = AppBskyActorDefs.ProfileViewBasic | AppBskyActorDefs.ProfileViewDetailed;
type PostView = AppBskyFeedDefs.PostView;

export interface NotificationModerationArgs {
	/** when unset, only rules that don't need preferences apply (hideable offenses, hidden replies). */
	moderationOpts: ModerationOptions | undefined;
	/** replies the viewer has hidden with a threadgate. */
	hiddenReplyUris: ReadonlySet<string>;
}

/**
 * applies list-time moderation to one notification: whether it belongs in the list at all, and which of its
 * actors or items do. render-time moderation (blurs, alerts) is left to the row.
 *
 * @param notification notification to moderate
 * @param args moderation inputs
 * @returns the same object when nothing is hidden, a copy without the hidden actors or items when only some
 *   are, or `undefined` when the whole notification should be dropped. views are never copied.
 */
export const moderateNotification = (
	notification: NotificationView,
	{ moderationOpts, hiddenReplyUris }: NotificationModerationArgs,
): NotificationView | undefined => {
	switch (notification.type) {
		case 'like':
		case 'repost':
		case 'likeViaRepost':
		case 'repostViaRepost':
		case 'generatorLike':
		case 'follow': {
			const hiddenDids = new Set<string>();
			for (const actor of notification.actors) {
				if (isActorHidden(actor, moderationOpts)) {
					hiddenDids.add(actor.did);
				}
			}
			if (hiddenDids.size === 0) {
				return notification;
			}
			const actors = notification.actors.filter((actor) => !hiddenDids.has(actor.did));
			if (!isNonEmpty(actors)) {
				return undefined;
			}
			// `count` stays as the server's total. hidden actors leave `actorDids` too, or "show more" would
			// load them only to hide them again
			return {
				...notification,
				actors,
				actorDids: notification.actorDids.filter((did) => !hiddenDids.has(did)),
			};
		}
		case 'multiPostLike':
		case 'multiPostRepost':
		case 'multiPostLikeViaRepost':
		case 'multiPostRepostViaRepost':
		case 'followBack':
		case 'verified':
		case 'unverified':
		case 'starterPackJoined':
		case 'contactMatch': {
			return isActorHidden(notification.actor, moderationOpts) ? undefined : notification;
		}
		case 'subscribedPost': {
			const items = notification.items.filter(
				(item) =>
					!isActorHidden(item.actor, moderationOpts) && !isSubscribedPostHidden(item.post, moderationOpts),
			);
			if (items.length === notification.items.length) {
				return notification;
			}
			if (!isNonEmpty(items)) {
				return undefined;
			}
			return { ...notification, items };
		}
		case 'reply':
		case 'quote':
		case 'mention': {
			if (notification.type === 'reply' && hiddenReplyUris.has(notification.post.uri)) {
				return undefined;
			}
			if (moderationOpts && isFiltered(moderatePost(notification.post, moderationOpts))) {
				return undefined;
			}
			return notification;
		}
	}
};

/**
 * hideable offenses are always hidden; otherwise anyone the viewer follows is kept.
 *
 * @param actor actor to check
 * @param moderationOpts active moderation options
 * @returns whether the actor is left out of notification lists
 */
export const isActorHidden = (actor: ProfileView, moderationOpts: ModerationOptions | undefined): boolean => {
	if (actor.labels?.some((label) => labelIsHideableOffense(label))) {
		return true;
	}
	if (!moderationOpts || actor.viewer?.following) {
		return false;
	}
	return isFiltered(moderateProfile(actor, moderationOpts));
};

/** subscribed posts are someone else's content, so muted words and the post's own labels apply too. */
const isSubscribedPostHidden = (post: PostView, moderationOpts: ModerationOptions | undefined): boolean => {
	if (!moderationOpts) {
		return false;
	}
	const record = getPostRecord(post);
	if (
		hasMutedWord({
			keywordFilters: moderationOpts.prefs.keywordFilters ?? [],
			text: record.text,
			facets: record.facets,
			outlineTags: record.tags,
			actor: post.author,
		})
	) {
		return true;
	}
	if (post.author.viewer?.following) {
		return false;
	}
	return isFiltered(moderatePost(post, moderationOpts));
};

const isFiltered = (decision: ModerationDecision): boolean => {
	return getDisplayRestrictions(decision, DisplayContext.ContentList).filters.length > 0;
};
