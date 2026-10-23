import type { ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updatePostShadow } from '#/state/cache/post-shadow';
import { RQKEY_AUTHOR as FEED_RQKEY_AUTHOR } from '#/state/queries/feed/keys';
import { profileQueryKey } from '#/state/queries/profile/keys';
import { updateOwnProfileRecord } from '#/state/queries/profile/lib/own-profile-record';
import { whenProfileViewReady } from '#/state/queries/profile/lib/when-profile-view-ready';
import { getClients, useSession } from '#/state/session';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export function usePinnedPostMutation() {
	const { currentAccount } = useSession();
	const { appview, pds } = getClients();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			postUri,
			postCid,
			action,
		}: {
			postUri: ResourceUri;
			postCid: string;
			action: 'pin' | 'unpin';
		}) => {
			const pinCurrentPost = action === 'pin';
			try {
				updatePostShadow(queryClient, postUri, { pinned: pinCurrentPost });

				if (!currentAccount || !pds) {
					throw new Error('Not signed in');
				}

				const previous = await updateOwnProfileRecord(pds, currentAccount.did, (existing) => {
					if (pinCurrentPost) {
						return { ...existing, pinnedPost: { uri: postUri, cid: postCid } };
					}
					// leave a pin made elsewhere in the meantime alone.
					if (existing?.pinnedPost?.uri !== postUri) {
						return undefined;
					}
					return { ...existing, pinnedPost: undefined };
				});

				const prevPinnedPost = previous?.pinnedPost?.uri;
				if (pinCurrentPost && prevPinnedPost && prevPinnedPost !== postUri) {
					updatePostShadow(queryClient, prevPinnedPost, { pinned: false });
				}

				await whenProfileViewReady(appview, currentAccount.did, (fresh) => {
					return (fresh.pinnedPost?.uri === postUri) === pinCurrentPost;
				});

				if (pinCurrentPost) {
					Toast.show(m['state.pin.pinned']());
				} else {
					Toast.show(m['state.pin.unpinned']());
				}

				void queryClient.invalidateQueries({
					queryKey: profileQueryKey(currentAccount.did),
				});
				void queryClient.invalidateQueries({
					queryKey: FEED_RQKEY_AUTHOR(currentAccount.did),
				});
			} catch (e) {
				console.error('Failed to pin post', e);
				Toast.show(m['state.pin.error']());
				// revert optimistic update
				updatePostShadow(queryClient, postUri, {
					pinned: !pinCurrentPost,
				});
			}
		},
	});
}
