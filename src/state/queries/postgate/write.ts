import type { AppBskyFeedPostgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createPostgateQueryKey } from '#/state/queries/postgate/keys';
import { writePostgateRecord } from '#/state/queries/postgate/lib/record';
import { getClients, useSession } from '#/state/session';

export function useWritePostgateMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			postUri,
			postgate,
		}: {
			postUri: ResourceUri;
			postgate: AppBskyFeedPostgate.Main;
		}) => {
			return writePostgateRecord({
				did: currentAccount!.did,
				pds: pds!,
				postUri,
				postgate,
			});
		},
		onSuccess(_, { postUri }) {
			void queryClient.invalidateQueries({
				queryKey: createPostgateQueryKey(postUri),
			});
		},
	});
}
