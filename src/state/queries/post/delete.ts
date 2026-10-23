import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteRecord } from '#/lib/api/records';

import { updatePostShadow } from '#/state/cache/post-shadow';
import { getClients, useSession } from '#/state/session';

export function usePostDeleteMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { uri: string }>({
		mutationFn: async ({ uri }) => {
			await deleteRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.feed.post',
				rkey: parseCanonicalResourceUri(uri).rkey,
			});
		},
		onSuccess(_, variables) {
			updatePostShadow(queryClient, variables.uri, { isDeleted: true });
		},
	});
}
