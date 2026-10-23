import type { AnyProfileView } from '@atcute/bluesky';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';
import { useToggleMutationQueue } from '#/lib/query/toggle-mutation-queue';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import type { Shadow } from '#/state/cache/types';
import { resetProfilePostsQueries } from '#/state/queries/feed/post-feed-cache';
import { LIST_CONVOS_RQKEY_ROOT } from '#/state/queries/messages/keys';
import { RQKEY_MY_BLOCKED } from '#/state/queries/moderation/keys';
import { getClients, useSession } from '#/state/session';

export function useProfileBlockMutationQueue(profile: Shadow<AnyProfileView>) {
	const queryClient = useQueryClient();
	const did = profile.did;
	const initialBlockingUri = profile.viewer?.blocking;
	const blockMutation = useProfileBlockMutation();
	const unblockMutation = useProfileUnblockMutation();

	const queueToggle = useToggleMutationQueue({
		initialState: initialBlockingUri,
		runMutation: async (prevBlockUri, shouldFollow) => {
			if (shouldFollow) {
				const { uri } = await blockMutation.mutateAsync({
					did,
				});
				return uri;
			} else {
				if (prevBlockUri) {
					await unblockMutation.mutateAsync({
						did,
						blockUri: prevBlockUri,
					});
				}
				return undefined;
			}
		},
		onSuccess(finalBlockingUri) {
			// finalize
			updateProfileShadow(queryClient, did, {
				blockingUri: finalBlockingUri,
			});
			// the shadow only reaches components that read profiles through shadow
			// hooks. the convo list is also read raw (e.g. the unread badge's
			// calculateCount, getMessageInfo), and blocks emit no chat log event,
			// so without a refetch that data stays stale indefinitely.
			void queryClient.invalidateQueries({ queryKey: [LIST_CONVOS_RQKEY_ROOT] });
		},
	});

	const queueBlock = () => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			blockingUri: 'pending',
		});
		return queueToggle(true);
	};

	const queueUnblock = () => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			blockingUri: undefined,
		});
		return queueToggle(false);
	};

	return [queueBlock, queueUnblock] as const;
}

function useProfileBlockMutation() {
	const { currentAccount } = useSession();
	const { pds } = getClients();
	const queryClient = useQueryClient();
	return useMutation<{ uri: ResourceUri; cid: string }, Error, { did: Did }>({
		mutationFn: async ({ did }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			return await createRecord(pds!, {
				repo: currentAccount.did,
				record: {
					$type: 'app.bsky.graph.block',
					createdAt: new Date().toISOString(),
					subject: did,
				},
			});
		},
		onSuccess(_, { did }) {
			void queryClient.invalidateQueries({ queryKey: RQKEY_MY_BLOCKED() });
			resetProfilePostsQueries(queryClient, did, 1000);
		},
	});
}

function useProfileUnblockMutation() {
	const { currentAccount } = useSession();
	const { pds } = getClients();
	const queryClient = useQueryClient();
	return useMutation<void, Error, { did: Did; blockUri: string }>({
		mutationFn: async ({ blockUri }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			await deleteRecord(pds!, {
				repo: currentAccount.did,
				collection: 'app.bsky.graph.block',
				rkey: parseCanonicalResourceUri(blockUri).rkey,
			});
		},
		onSuccess(_, { did }) {
			resetProfilePostsQueries(queryClient, did, 1000);
		},
	});
}
