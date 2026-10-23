import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';
import { useToggleMutationQueue } from '#/lib/query/toggle-mutation-queue';

import { updatePostShadow } from '#/state/cache/post-shadow';
import type { Shadow } from '#/state/cache/types';
import { getClients, useSession } from '#/state/session';

export function usePostRepostMutationQueue(
	post: Shadow<AppBskyFeedDefs.PostView>,
	viaRepost: { uri: ResourceUri; cid: string } | undefined,
) {
	const queryClient = useQueryClient();
	const postUri = post.uri;
	const postCid = post.cid;
	const initialRepostUri = post.viewer?.repost;
	const repostMutation = usePostRepostMutation();
	const unrepostMutation = usePostUnrepostMutation();

	const queueToggle = useToggleMutationQueue({
		initialState: initialRepostUri,
		runMutation: async (prevRepostUri, shouldRepost) => {
			if (shouldRepost) {
				const { uri: repostUri } = await repostMutation.mutateAsync({
					uri: postUri,
					cid: postCid,
					via: viaRepost,
				});
				return repostUri;
			} else {
				if (prevRepostUri) {
					await unrepostMutation.mutateAsync({
						postUri: postUri,
						repostUri: prevRepostUri,
					});
				}
				return undefined;
			}
		},
		onSuccess(finalRepostUri) {
			// finalize
			updatePostShadow(queryClient, postUri, {
				repostUri: finalRepostUri,
			});
		},
	});

	const queueRepost = () => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			repostUri: 'pending',
		});
		return queueToggle(true);
	};

	const queueUnrepost = () => {
		// optimistically update
		updatePostShadow(queryClient, postUri, {
			repostUri: undefined,
		});
		return queueToggle(false);
	};

	return [queueRepost, queueUnrepost] as const;
}

function usePostRepostMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<
		{ uri: ResourceUri }, // responds with the uri of the repost
		Error,
		{ uri: ResourceUri; cid: string; via?: { uri: ResourceUri; cid: string } } // the post's uri and cid, and the repost uri/cid if present
	>({
		mutationFn: ({ uri, cid, via }) => {
			return createRecord(pds!, {
				repo: currentAccount!.did,
				record: {
					$type: 'app.bsky.feed.repost',
					createdAt: new Date().toISOString(),
					subject: { cid: cid, uri: uri },
					via: via && { cid: via.cid, uri: via.uri },
				},
			});
		},
	});
}

function usePostUnrepostMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { postUri: string; repostUri: string }>({
		mutationFn: ({ postUri: _postUri, repostUri }) => {
			return deleteRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.feed.repost',
				rkey: parseCanonicalResourceUri(repostUri).rkey,
			});
		},
	});
}
