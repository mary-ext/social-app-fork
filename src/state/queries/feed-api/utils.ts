import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { BSKY_FEED_OWNER_DIDS } from '#/lib/constants/feeds';

import type { UsePreferencesQueryResponse } from '#/state/queries/preferences';

let debugTopics = '';
if (typeof window !== 'undefined') {
	const params = new URLSearchParams(window.location.search);
	debugTopics = params.get('debug_topics') ?? '';
}

export function createBskyTopicsHeader(userInterests?: string) {
	return {
		'x-atproto-bsky-topics': debugTopics || userInterests || '',
	};
}

/**
 * serializes interests for the topics header.
 *
 * @param preferences the user's preferences.
 * @returns comma-separated tags with `;updatedAt` appended when present, even if the tags are empty.
 */
export function serializeUserInterests(preferences?: UsePreferencesQueryResponse) {
	const interests = preferences?.interests.tags.join(',') ?? '';
	const updatedAt = preferences?.interests.updatedAt;
	return updatedAt ? `${interests};${updatedAt}` : interests;
}

export function isBlueskyOwnedFeed(feedUri: string) {
	const uri = parseCanonicalResourceUri(feedUri);
	return BSKY_FEED_OWNER_DIDS.includes(uri.repo);
}
