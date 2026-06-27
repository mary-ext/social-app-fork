import { ok } from '@atcute/client';
import type { ActorIdentifier, ResourceUri } from '@atcute/lexicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';

import { logger } from '#/logger';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import { updatePostShadow } from '../cache/post-shadow';
import { useClients, useSession } from '../session';
import { useProfileUpdateMutation } from './profile';

export function usePinnedPostMutation() {
	const { currentAccount } = useSession();
	const { appview } = useClients();
	const queryClient = useQueryClient();
	const { mutateAsync: profileUpdateMutate } = useProfileUpdateMutation();

	return useMutation({
		mutationFn: async ({
			postUri,
			postCid,
			action,
		}: {
			postUri: string;
			postCid: string;
			action: 'pin' | 'unpin';
		}) => {
			const pinCurrentPost = action === 'pin';
			let prevPinnedPost: string | undefined;
			try {
				updatePostShadow(queryClient, postUri, { pinned: pinCurrentPost });

				// get the currently pinned post so we can optimistically remove the pin from it
				if (!currentAccount) throw new Error('Not signed in');
				const profile = await ok(
					appview.get('app.bsky.actor.getProfile', {
						params: { actor: currentAccount.did as ActorIdentifier },
					}),
				);
				prevPinnedPost = profile.pinnedPost?.uri;
				if (prevPinnedPost && prevPinnedPost !== postUri) {
					updatePostShadow(queryClient, prevPinnedPost, { pinned: false });
				}

				await profileUpdateMutate({
					profile,
					updates: (existing) => {
						existing.pinnedPost = pinCurrentPost ? { uri: postUri as ResourceUri, cid: postCid } : undefined;
						return existing;
					},
					checkCommitted: (res) => (pinCurrentPost ? res.pinnedPost?.uri === postUri : !res.pinnedPost),
				});

				if (pinCurrentPost) {
					Toast.show(m['state.toast.postPinned']());
				} else {
					Toast.show(m['state.toast.postUnpinned']());
				}

				void queryClient.invalidateQueries({
					queryKey: FEED_RQKEY(`author|${currentAccount.did}|posts_and_author_threads`),
				});
				void queryClient.invalidateQueries({
					queryKey: FEED_RQKEY(`author|${currentAccount.did}|posts_with_replies`),
				});
			} catch (e) {
				Toast.show(m['state.error.pinPost']());
				logger.error('Failed to pin post', { message: String(e) });
				// revert optimistic update
				updatePostShadow(queryClient, postUri, {
					pinned: !pinCurrentPost,
				});
				if (prevPinnedPost && prevPinnedPost !== postUri) {
					updatePostShadow(queryClient, prevPinnedPost, { pinned: true });
				}
			}
		},
	});
}
