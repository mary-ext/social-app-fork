import type { AppBskyBookmarkGetBookmarks, AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { $type } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';
import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from '#/state/queries/util';
import { useClients } from '#/state/session';

export const bookmarksQueryKeyRoot = 'bookmarks';
export const createBookmarksQueryKey = () => [bookmarksQueryKeyRoot];

export function useBookmarksQuery() {
	const { appview } = useClients();

	return useInfiniteQuery<
		AppBskyBookmarkGetBookmarks.$output,
		Error,
		InfiniteData<AppBskyBookmarkGetBookmarks.$output>,
		QueryKey,
		string | undefined
	>({
		queryKey: createBookmarksQueryKey(),
		queryFn: ({ pageParam }) =>
			ok(
				appview.get('app.bsky.bookmark.getBookmarks', {
					params: { cursor: pageParam },
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

export async function optimisticallySaveBookmark(qc: QueryClient, post: AppBskyFeedDefs.PostView) {
	qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.$output>>(
		{
			queryKey: [bookmarksQueryKeyRoot],
		},
		(data) => {
			if (!data) return data;
			return {
				...data,
				pages: data.pages.map((page, index) => {
					if (index === 0) {
						post.$type = 'app.bsky.feed.defs#postView';
						return {
							...page,
							bookmarks: [
								{
									createdAt: new Date().toISOString(),
									subject: {
										uri: post.uri,
										cid: post.cid,
									},
									item: post as $type.enforce<AppBskyFeedDefs.PostView>,
								},
								...page.bookmarks,
							],
						};
					}
					return page;
				}),
			};
		},
	);
}

export async function optimisticallyDeleteBookmark(qc: QueryClient, { uri }: { uri: string }) {
	qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.$output>>(
		{
			queryKey: [bookmarksQueryKeyRoot],
		},
		(data) => {
			if (!data) return data;
			return {
				...data,
				pages: data.pages.map((page) => {
					return {
						...page,
						bookmarks: page.bookmarks.filter((b) => b.subject.uri !== uri),
					};
				}),
			};
		},
	);
}

export function* findAllPostsInQueryData(
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
		for (const page of queryData?.pages) {
			for (const bookmark of page.bookmarks) {
				if (bookmark.item.$type !== 'app.bsky.feed.defs#postView') continue;

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
