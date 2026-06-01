import { useCallback } from 'react';
import { ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';
import { useQueryClient } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { useClients } from '#/state/session';

const handleQueryKeyRoot = 'handle';
const fetchHandleQueryKey = (handleOrDid: string) => [handleQueryKeyRoot, handleOrDid];

export function useFetchHandle() {
	const queryClient = useQueryClient();
	const { appview } = useClients();

	return useCallback(
		async (handleOrDid: string) => {
			if (handleOrDid.startsWith('did:')) {
				const res = await queryClient.fetchQuery({
					staleTime: STALE.MINUTES.FIVE,
					queryKey: fetchHandleQueryKey(handleOrDid),
					queryFn: () =>
						ok(
							appview.get('app.bsky.actor.getProfile', {
								params: { actor: handleOrDid as ActorIdentifier },
							}),
						),
				});
				return res.handle;
			}
			return handleOrDid;
		},
		[queryClient, appview],
	);
}
