import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';
import { useToggleMutationQueue } from '#/lib/query/toggle-mutation-queue';

import { updatePostShadow } from '#/state/cache/post-shadow';
import type { Shadow } from '#/state/cache/types';
import { getClients, useSession } from '#/state/session';

export function usePostLikeMutationQueue(
	post: Shadow<AppBskyFeedDefs.PostView>,
	viaRepost: { uri: ResourceUri; cid: string } | undefined,
) {
	const queryClient = useQueryClient();
	const postUri = post.uri;
	const postCid = post.cid;
	const initialLikeUri = post.viewer?.like;
	const likeMutation = usePostLikeMutation();
	const unlikeMutation = usePostUnlikeMutation();

	const queueToggle = useToggleMutationQueue({
		initialState: initialLikeUri,
		runMutation: async (prevLikeUri, shouldLike) => {
			if (shouldLike) {
				const { uri: likeUri } = await likeMutation.mutateAsync({
					uri: postUri,
					cid: postCid,
					via: viaRepost,
				});
				return likeUri;
			} else {
				if (prevLikeUri) {
					await unlikeMutation.mutateAsync({
						postUri: postUri,
						likeUri: prevLikeUri,
					});
				}
				return undefined;
			}
		},
		onSuccess(finalLikeUri) {
			// finalize
			updatePostShadow(queryClient, postUri, {
				likeUri: finalLikeUri,
			});
		},
	});

	const queueLike = () => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			likeUri: 'pending',
		});
		return queueToggle(true);
	};

	const queueUnlike = () => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			likeUri: undefined,
		});
		return queueToggle(false);
	};

	return [queueLike, queueUnlike] as const;
}

function usePostLikeMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<
		{ uri: ResourceUri }, // responds with the uri of the like
		Error,
		{ uri: ResourceUri; cid: string; via?: { uri: ResourceUri; cid: string } } // the post's uri and cid, and the repost uri/cid if present
	>({
		mutationFn: ({ uri, cid, via }) => {
			return createRecord(pds!, {
				repo: currentAccount!.did,
				record: {
					$type: 'app.bsky.feed.like',
					createdAt: new Date().toISOString(),
					subject: { cid: cid, uri: uri },
					via: via && { cid: via.cid, uri: via.uri },
				},
			});
		},
	});
}

function usePostUnlikeMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { postUri: string; likeUri: string }>({
		mutationFn: ({ postUri: _postUri, likeUri }) => {
			return deleteRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.feed.like',
				rkey: parseCanonicalResourceUri(likeUri).rkey,
			});
		},
	});
}
