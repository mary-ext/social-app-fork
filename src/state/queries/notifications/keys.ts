// keys imported across modules. keep this file free of runtime imports: the unread provider is mounted
// in the root bundle and must not pull in the notification feed query.

import type { GroupedNotificationsFeed } from '#/lib/notifications/types';

export const NOTIFICATION_FEED_RQKEY_ROOT = 'notification-feed';

/**
 * @param feed grouped notifications feed
 * @returns its query key
 */
export const notificationFeedQueryKey = (feed: GroupedNotificationsFeed) => [
	NOTIFICATION_FEED_RQKEY_ROOT,
	feed,
];

export const NOTIFICATION_GROUP_ACTORS_RQKEY_ROOT = 'notification-group-actors';

/**
 * @param notificationId the group's id
 * @returns the query key for the group's "show more" actors
 */
export const notificationGroupActorsQueryKey = (notificationId: string) => [
	NOTIFICATION_GROUP_ACTORS_RQKEY_ROOT,
	notificationId,
];

export const NOTIFICATION_SETTINGS_APP_RQKEY = ['notification-settings', 'app'];
export const NOTIFICATION_SETTINGS_CHAT_RQKEY = ['notification-settings', 'chat'];

export const RQKEY_getActivitySubscriptions = ['activity-subscriptions'];
