import type { AppBskyBookmarkGetBookmarks, AppBskyFeedDefs } from '@atcute/bluesky';

import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { bookmarksQueryKeyRoot } from '#/state/queries/post/keys';

export function optimisticallySaveBookmark(qc: QueryClient, post: AppBskyFeedDefs.PostView) {
	qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.$output>>(
		{
			queryKey: [bookmarksQueryKeyRoot],
		},
		(data) => {
			if (!data) {
				return data;
			}
			return {
				...data,
				pages: data.pages.map((page, index) => {
					if (index === 0) {
						return {
							...page,
							bookmarks: [
								{
									createdAt: new Date().toISOString(),
									subject: {
										uri: post.uri,
										cid: post.cid,
									},
									item: { $type: 'app.bsky.feed.defs#postView', ...post },
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

export function optimisticallyDeleteBookmark(qc: QueryClient, { uri }: { uri: string }) {
	qc.setQueriesData<InfiniteData<AppBskyBookmarkGetBookmarks.$output>>(
		{
			queryKey: [bookmarksQueryKeyRoot],
		},
		(data) => {
			if (!data) {
				return data;
			}
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
