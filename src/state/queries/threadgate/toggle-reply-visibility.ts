import type { AppBskyFeedThreadgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createThreadgateRecord, mergeThreadgateRecords } from '#/lib/threadgate';

import { threadgateRecordQueryKeyRoot } from '#/state/queries/threadgate/keys';
import { upsertThreadgate } from '#/state/queries/threadgate/lib/record';
import { getClients, useSession } from '#/state/session';
import { setReplyHidden } from '#/state/threadgate-hidden-replies';

export function useToggleReplyVisibilityMutation() {
	const { appview, pds } = getClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			postUri,
			replyUri,
			action,
		}: {
			postUri: ResourceUri;
			replyUri: ResourceUri;
			action: 'hide' | 'show';
		}) => {
			setReplyHidden(replyUri, action === 'hide');

			await upsertThreadgate(
				{ appview, did: currentAccount!.did, pds: pds!, postUri },
				(prev): AppBskyFeedThreadgate.Main | undefined => {
					if (prev) {
						if (action === 'hide') {
							return mergeThreadgateRecords(prev, {
								hiddenReplies: [replyUri],
							});
						} else if (action === 'show') {
							return {
								...prev,
								hiddenReplies: prev.hiddenReplies?.filter((uri) => uri !== replyUri) || [],
							};
						}
					} else {
						if (action === 'hide') {
							return createThreadgateRecord({
								hiddenReplies: [replyUri],
								post: postUri,
							});
						}
					}
				},
			);
		},
		onSuccess() {
			void queryClient.invalidateQueries({
				queryKey: [threadgateRecordQueryKeyRoot],
			});
		},
		onError(_, { replyUri, action }) {
			// roll the optimistic toggle back
			setReplyHidden(replyUri, action !== 'hide');
		},
	});
}
