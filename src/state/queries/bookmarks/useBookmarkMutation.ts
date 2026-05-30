import { type AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type ResourceUri } from '@atcute/lexicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isNetworkError } from '#/lib/strings/errors';

import { updatePostShadow } from '#/state/cache/post-shadow';
import {
	optimisticallyDeleteBookmark,
	optimisticallySaveBookmark,
} from '#/state/queries/bookmarks/useBookmarksQuery';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

type MutationArgs =
	| { action: 'create'; post: AppBskyFeedDefs.PostView }
	| {
			action: 'delete';
			/**
			 * For deletions, we only need to URI. Plus, in some cases we only know the URI, such as when a post was
			 * deleted by the author.
			 */
			uri: string;
	  };

export function useBookmarkMutation() {
	const qc = useQueryClient();
	const { appview } = useClients();

	return useMutation({
		async mutationFn(args: MutationArgs) {
			if (args.action === 'create') {
				updatePostShadow(qc, args.post.uri, { bookmarked: true });
				await ok(
					appview.post('app.bsky.bookmark.createBookmark', {
						as: null,
						input: { cid: args.post.cid, uri: args.post.uri },
					}),
				);
			} else if (args.action === 'delete') {
				updatePostShadow(qc, args.uri, { bookmarked: false });
				await ok(
					appview.post('app.bsky.bookmark.deleteBookmark', {
						as: null,
						input: { uri: args.uri as ResourceUri },
					}),
				);
			}
		},
		onSuccess(_, args) {
			if (args.action === 'create') {
				optimisticallySaveBookmark(qc, args.post);
			} else if (args.action === 'delete') {
				optimisticallyDeleteBookmark(qc, { uri: args.uri });
			}
		},
		onError(e, args) {
			if (args.action === 'create') {
				updatePostShadow(qc, args.post.uri, { bookmarked: false });
			} else if (args.action === 'delete') {
				updatePostShadow(qc, args.uri, { bookmarked: true });
			}

			if (!isNetworkError(e)) {
				logger.error('bookmark mutation failed', {
					bookmarkAction: args.action,
					safeMessage: e,
				});
			}
		},
	});
}
