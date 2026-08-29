import type { Did } from '@atcute/lexicons';

import { useQueryClient } from '@tanstack/react-query';

import { resolveMiniDoc } from '#/lib/api/slingshot-client';

import { GCTIME, STALE } from '#/state/queries';

const pdsQueryKeyRoot = 'pds';
const fetchPdsQueryKey = (did: Did) => [pdsQueryKeyRoot, did];

/**
 * resolves an account's PDS URL.
 *
 * @returns a function taking a DID and resolving to the PDS origin, with a trailing slash
 */
export function useFetchPdsUrl() {
	const queryClient = useQueryClient();

	return async (did: Did) => {
		const { pds } = await queryClient.fetchQuery({
			gcTime: GCTIME.MINUTES.FIVE,
			staleTime: STALE.HOURS.ONE,
			queryKey: fetchPdsQueryKey(did),
			queryFn: ({ signal }) => resolveMiniDoc(did, signal),
		});

		return pds;
	};
}
