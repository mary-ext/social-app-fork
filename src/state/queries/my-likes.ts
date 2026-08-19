import type { AppBskyFeedDefs, AppBskyFeedGetActorLikes } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from '#/state/queries/util';
import { getClients, getCurrentDid } from '#/state/session';

const RQKEY_ROOT = 'my-likes';
// the account provider scopes this cache.
const RQKEY = () => [RQKEY_ROOT];

/** paginates the current account's likes. */
export function useMyLikesQuery() {
	const { appview } = getClients();
	const did = getCurrentDid();

	return useInfiniteQuery<
		AppBskyFeedGetActorLikes.$output,
		Error,
		InfiniteData<AppBskyFeedGetActorLikes.$output>,
		QueryKey,
		string | undefined
	>({
		queryKey: RQKEY(),
		enabled: did !== undefined,
		queryFn: ({ pageParam, signal }) =>
			ok(
				appview.get('app.bsky.feed.getActorLikes', {
					signal,
					params: { actor: did!, cursor: pageParam },
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

export function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedGetActorLikes.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	const atUri = parseResourceUri(uri);

	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const item of page.feed) {
				if (didOrHandleUriMatches(atUri, item.post)) {
					yield item.post;
				}

				const quotedPost = getEmbeddedPost(item.post.embed);
				if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
					yield embedViewRecordToPostView(quotedPost);
				}
			}
		}
	}
}

registerShadowFinders(RQKEY_ROOT, {
	findPosts: findAllPostsInQueryData,
});
