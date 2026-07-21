import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { useQuery } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { STALE } from '..';

const RQKEY_ROOT = 'convo-availability';
export const RQKEY = (did: string) => [RQKEY_ROOT, did];

export function useGetConvoAvailabilityQuery(did: Did, { enabled = true }: { enabled?: boolean } = {}) {
	const { chat } = useClients();

	return useQuery({
		queryKey: RQKEY(did),
		queryFn: async () => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.get('chat.bsky.convo.getConvoAvailability', {
					params: { members: [did] },
				}),
			);

			return data;
		},
		staleTime: STALE.INFINITY,
		enabled,
	});
}
