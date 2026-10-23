import type { AppBskyFeedPost, AppBskyNotificationListNotifications } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateNotification,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { labelIsHideableOffense } from '#/lib/moderation/causes';
import { hasMutedWord } from '#/lib/moderation/muted-words';

/**
 * @param notification notification to check
 * @param moderationOpts active moderation options
 * @returns whether the notification is hidden
 */
export function shouldFilterNotification(
	notification: AppBskyNotificationListNotifications.Notification,
	moderationOpts: ModerationOptions | undefined,
): boolean {
	const containsImperative = !!notification.author.labels?.some((label) => labelIsHideableOffense(label));
	if (containsImperative) {
		return true;
	}
	if (!moderationOpts) {
		return false;
	}
	if (notification.reason === 'subscribed-post') {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the `subscribed-post` reason fixes the collection
		const record = notification.record as AppBskyFeedPost.Main;
		if (
			hasMutedWord({
				keywordFilters: moderationOpts.prefs.keywordFilters ?? [],
				text: record.text,
				facets: record.facets,
				outlineTags: record.tags,
				actor: notification.author,
			})
		) {
			return true;
		}
	}
	if (notification.author.viewer?.following) {
		return false;
	}
	return (
		getDisplayRestrictions(moderateNotification(notification, moderationOpts), DisplayContext.ContentList)
			.filters.length > 0
	);
}
