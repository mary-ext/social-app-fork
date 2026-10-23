// keys imported across modules. keep this file free of runtime imports: the unread provider is mounted
// in the root bundle and must not pull in the notification feed query.

export const NOTIFICATION_FEED_RQKEY_ROOT = 'notification-feed';

/**
 * @param filter notification filter
 * @returns its query key
 */
export const notificationFeedQueryKey = (filter: 'all' | 'mentions') => [
	NOTIFICATION_FEED_RQKEY_ROOT,
	filter,
];

export const NOTIFICATION_SETTINGS_APP_RQKEY = ['notification-settings', 'app'];
export const NOTIFICATION_SETTINGS_CHAT_RQKEY = ['notification-settings', 'chat'];

export const RQKEY_getActivitySubscriptions = ['activity-subscriptions'];
