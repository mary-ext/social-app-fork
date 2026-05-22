import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { useAgent } from '#/state/session';

const handleQueryKeyRoot = 'handle';
const fetchHandleQueryKey = (handleOrDid: string) => [handleQueryKeyRoot, handleOrDid];

export function useFetchHandle() {
	const queryClient = useQueryClient();
	const agent = useAgent();

	return useCallback(
		async (handleOrDid: string) => {
			if (handleOrDid.startsWith('did:')) {
				const res = await queryClient.fetchQuery({
					staleTime: STALE.MINUTES.FIVE,
					queryKey: fetchHandleQueryKey(handleOrDid),
					queryFn: () => agent.getProfile({ actor: handleOrDid }),
				});
				return res.data.handle;
			}
			return handleOrDid;
		},
		[queryClient, agent],
	);
}
