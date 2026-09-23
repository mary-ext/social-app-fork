import { DISCOVER_FEED_URI, TIMELINE_SAVED_FEED } from '#/lib/constants/feeds';

import { m } from '#/paraglide/messages';

/**
 * localizes the Following and Discover feed names.
 *
 * @param feed the feed's display name and URI.
 * @returns the localized name for built-in feeds, otherwise the feed's display name.
 */
export const getLocalizedFeedName = (feed: { displayName: string; uri: string }): string => {
	switch (feed.uri) {
		case TIMELINE_SAVED_FEED.value: {
			return m['common.feeds.following']();
		}
		case DISCOVER_FEED_URI: {
			return m['common.feeds.discover']();
		}
	}
	return feed.displayName;
};
