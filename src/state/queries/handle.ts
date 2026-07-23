import { ok } from '@atcute/client';
import { isDid } from '@atcute/lexicons/syntax';

import { useQueryClient } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { getClients } from '#/state/session';

const handleQueryKeyRoot = 'handle';
const fetchHandleQueryKey = (handleOrDid: string) => [handleQueryKeyRoot, handleOrDid];

export function useFetchHandle() {
	const queryClient = useQueryClient();
	const { appview } = getClients();

	return async (handleOrDid: string) => {
		if (isDid(handleOrDid)) {
			const res = await queryClient.fetchQuery({
				staleTime: STALE.MINUTES.FIVE,
				queryKey: fetchHandleQueryKey(handleOrDid),
				queryFn: () =>
					ok(
						appview.get('app.bsky.actor.getProfile', {
							params: { actor: handleOrDid },
						}),
					),
			});
			return res.handle;
		}
		return handleOrDid;
	};
}
