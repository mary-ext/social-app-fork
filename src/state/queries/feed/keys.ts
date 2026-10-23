import type { Did } from '@atcute/lexicons/syntax';

import { type FeedDescriptor, toFeedRequest } from '#/lib/feeds/descriptor';

// #region post feeds

export const RQKEY_ROOT = 'post-feed';
export function RQKEY(feedDesc: FeedDescriptor) {
	return [RQKEY_ROOT, toFeedRequest(feedDesc)];
}

/**
 * creates a partial key for an author's feeds.
 *
 * @param did the author DID
 * @returns the query key
 */
export function RQKEY_AUTHOR(did: Did) {
	return [RQKEY_ROOT, { type: 'author', did }];
}

// #endregion

// #region feed sources

export const feedSourceInfoQueryKey = ({ uri }: { uri: string }) => ['getFeedSourceInfo', uri];

/** root of the pinned and saved feed info queries. */
export const FEED_INFO_RQKEY_ROOT = 'feed-info';

export const createGetSuggestedFeedsQueryKey = () => ['suggested-feeds'];

// #endregion
