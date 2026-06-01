import { useCallback, useRef } from 'react';
import type { AppBskyFeedDefs } from '@atcute/bluesky';

export type PostViewLogContext =
	| 'FeedItem'
	| 'PostThreadItem'
	| 'Post'
	| 'ImmersiveVideo'
	| 'SearchResults'
	| 'Bookmarks'
	| 'Notifications'
	| 'Hashtag'
	| 'Topic'
	| 'PostQuotes';

/**
 * Hook that returns a callback to track post:view events. Handles deduplication so the same post URI is only
 * tracked once per mount.
 *
 * @param logContext - The context where the post is being viewed
 * @returns A callback that accepts a post and logs the view event
 */
export function usePostViewTracking(logContext: PostViewLogContext) {
	const seenUrisRef = useRef(new Set<string>());

	const trackPostView = useCallback(
		(post: AppBskyFeedDefs.PostView) => {
			if (seenUrisRef.current.has(post.uri)) return;
			seenUrisRef.current.add(post.uri);
		},
		[logContext],
	);

	return trackPostView;
}
