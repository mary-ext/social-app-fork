export const NOTIFICATION_FEED_RQKEY_ROOT = 'notification-feed';

/**
 * @param filter notification filter
 * @returns its query key
 */
export const notificationFeedQueryKey = (filter: 'all' | 'mentions') => [
	NOTIFICATION_FEED_RQKEY_ROOT,
	filter,
];
