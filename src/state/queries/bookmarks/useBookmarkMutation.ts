import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updatePostShadow } from '#/state/cache/post-shadow';
import {
	optimisticallyDeleteBookmark,
	optimisticallySaveBookmark,
} from '#/state/queries/bookmarks/useBookmarksQuery';
import { getClients } from '#/state/session';

type MutationArgs =
	| { action: 'create'; post: AppBskyFeedDefs.PostView }
	| {
			action: 'delete';
			/** uri of the deleted item */
			uri: ResourceUri;
	  };

export function useBookmarkMutation() {
	const qc = useQueryClient();
	const { appview } = getClients();

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
						input: { uri: args.uri },
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

			console.error('bookmark mutation failed', args.action, e);
		},
	});
}
