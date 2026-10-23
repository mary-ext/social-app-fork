import type { AppBskyBookmarkGetBookmarks, AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import {
	didOrHandleUriMatches,
	embedViewRecordToPostView,
	getEmbeddedPost,
} from '#/state/cache/finder-utils';
import { registerShadowFinders } from '#/state/cache/registry';
import { bookmarksQueryKeyRoot, createBookmarksQueryKey } from '#/state/queries/post/keys';
import { getClients } from '#/state/session';

export function useBookmarksQuery() {
	const { appview } = getClients();

	return useInfiniteQuery<
		AppBskyBookmarkGetBookmarks.$output,
		Error,
		InfiniteData<AppBskyBookmarkGetBookmarks.$output>,
		QueryKey,
		string | undefined
	>({
		queryKey: createBookmarksQueryKey(),
		queryFn: ({ pageParam, signal }) =>
			ok(
				appview.get('app.bsky.bookmark.getBookmarks', {
					signal,
					params: { cursor: pageParam },
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.$output>>({
		queryKey: [bookmarksQueryKeyRoot],
	});
	const atUri = parseResourceUri(uri);

	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const bookmark of page.bookmarks) {
				if (bookmark.item.$type !== 'app.bsky.feed.defs#postView') {
					continue;
				}

				if (didOrHandleUriMatches(atUri, bookmark.item)) {
					yield bookmark.item;
				}

				const quotedPost = getEmbeddedPost(bookmark.item.embed);
				if (quotedPost && didOrHandleUriMatches(atUri, quotedPost)) {
					yield embedViewRecordToPostView(quotedPost);
				}
			}
		}
	}
}

registerShadowFinders(bookmarksQueryKeyRoot, {
	findPosts: findAllPostsInQueryData,
});
