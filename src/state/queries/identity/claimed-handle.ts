import type { Did } from '@atcute/lexicons';

import { useQuery } from '@tanstack/react-query';

import { getClaimedHandle } from '#/lib/api/did-document';
import { GCTIME, STALE } from '#/lib/query/const';

/**
 * queries the handle an account claims in its DID document, without verifying it.
 *
 * @param did the account
 * @param enabled whether to run the query
 * @returns a query whose data is the claimed handle, or null if the document claims none
 */
export function useClaimedHandleQuery({ did, enabled }: { did: Did; enabled: boolean }) {
	return useQuery({
		enabled,
		gcTime: GCTIME.MINUTES.FIVE,
		queryKey: ['claimed-handle', did],
		// cache missing handles too; query functions cannot return undefined.
		queryFn: async ({ signal }) => (await getClaimedHandle(did, signal)) ?? null,
		retry: false,
		staleTime: STALE.MINUTES.FIVE,
	});
}
