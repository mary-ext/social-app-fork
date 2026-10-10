import type { AppBskyFeedThreadgate } from '@atcute/bluesky';

import { unique, uniqueBy } from '@mary-ext/array-fns';

/**
 * merges two {@link AppBskyFeedThreadgate.Main} objects, combining and deduplicating their `allow` and
 * `hiddenReplies` arrays.
 *
 * @param a first threadgate object
 * @param b second threadgate object
 * @returns the merged threadgate object
 */
export function mergeThreadgateRecords(
	prev: AppBskyFeedThreadgate.Main,
	next: Partial<AppBskyFeedThreadgate.Main>,
): AppBskyFeedThreadgate.Main {
	// can be undefined if everyone can reply!
	const allow: AppBskyFeedThreadgate.Main['allow'] | undefined =
		prev.allow || next.allow
			? uniqueBy([...(prev.allow || []), ...(next.allow || [])], (v) => v.$type)
			: undefined;
	const hiddenReplies = unique([...(prev.hiddenReplies || []), ...(next.hiddenReplies || [])]);

	return createThreadgateRecord({
		allow, // can be undefined!
		hiddenReplies,
		post: prev.post,
	});
}

/** Create a new {@link AppBskyFeedThreadgate.Main} object with the given properties. */
export function createThreadgateRecord(
	threadgate: Partial<AppBskyFeedThreadgate.Main>,
): AppBskyFeedThreadgate.Main {
	if (!threadgate.post) {
		throw new Error('Cannot create a threadgate record without a post URI');
	}

	return {
		$type: 'app.bsky.feed.threadgate',
		allow: threadgate.allow, // can be undefined!
		createdAt: new Date().toISOString(),
		hiddenReplies: threadgate.hiddenReplies || [],
		post: threadgate.post,
	};
}
