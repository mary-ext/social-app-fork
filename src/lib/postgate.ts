import type { AppBskyFeedPostgate } from '@atcute/bluesky';

import { unique, uniqueBy } from '@mary-ext/array-fns';

export const POSTGATE_COLLECTION = 'app.bsky.feed.postgate';

export function createPostgateRecord(
	postgate: Partial<AppBskyFeedPostgate.Main> & {
		post: AppBskyFeedPostgate.Main['post'];
	},
): AppBskyFeedPostgate.Main {
	return {
		$type: POSTGATE_COLLECTION,
		createdAt: new Date().toISOString(),
		post: postgate.post,
		detachedEmbeddingUris: postgate.detachedEmbeddingUris || [],
		embeddingRules: postgate.embeddingRules || [],
	};
}

export function mergePostgateRecords(
	prev: AppBskyFeedPostgate.Main,
	next: Partial<AppBskyFeedPostgate.Main>,
) {
	const detachedEmbeddingUris = unique([
		...(prev.detachedEmbeddingUris || []),
		...(next.detachedEmbeddingUris || []),
	]);
	const embeddingRules = uniqueBy(
		[...(prev.embeddingRules || []), ...(next.embeddingRules || [])],
		(rule) => rule.$type,
	);
	return createPostgateRecord({
		post: prev.post,
		detachedEmbeddingUris,
		embeddingRules,
	});
}
