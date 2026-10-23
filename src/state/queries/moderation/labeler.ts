import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { useQuery } from '@tanstack/react-query';

import { GCTIME, STALE } from '#/lib/query/const';

import { createQueryPersister } from '#/state/query-persister';
import { getClients } from '#/state/session';

const LABELER_INFO_RQKEY_ROOT = 'labeler-info';
const labelerInfoQueryKey = (did: string) => [LABELER_INFO_RQKEY_ROOT, did];

const LABELERS_DETAILED_INFO_RQKEY_ROOT = 'labelers-detailed-info';
const createLabelersDetailedInfoQueryKey = (dids: string[]) => [LABELERS_DETAILED_INFO_RQKEY_ROOT, { dids }];
const labelersDetailedInfoQueryPersister = createQueryPersister({ version: 1 });

/**
 * queries the labeler service record published by an account.
 *
 * @param did the account's did; the query idles until it is known
 * @returns a query whose data is the detailed service view, or null if the account publishes no labeler
 *   service
 */
export function useLabelerInfoQuery({ did }: { did?: Did }) {
	const { appview } = getClients();
	return useQuery({
		queryKey: labelerInfoQueryKey(did ?? ''),
		enabled: !!did,
		staleTime: STALE.MINUTES.ONE,
		queryFn: async ({ signal }) => {
			const data = await ok(
				appview.get('app.bsky.labeler.getServices', {
					signal,
					params: { detailed: true, dids: [did!] },
				}),
			);

			// the appview omits dids that don't publish a service, so an empty result isn't an error
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `detailed: true` makes the service views detailed
			return (data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed | undefined) ?? null;
		},
	});
}

export function useLabelersDetailedInfoQuery({ dids }: { dids: Did[] }) {
	const { appview } = getClients();
	return useQuery({
		queryKey: createLabelersDetailedInfoQueryKey(dids),
		enabled: !!dids.length,
		staleTime: STALE.MINUTES.ONE,
		gcTime: GCTIME.DAYS.SEVEN,
		queryFn: async ({ signal }) => {
			const data = await ok(
				appview.get('app.bsky.labeler.getServices', {
					signal,
					params: { detailed: true, dids },
				}),
			);
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `detailed: true` makes the service views detailed
			return data.views as AppBskyLabelerDefs.LabelerViewDetailed[];
		},
		persister: labelersDetailedInfoQueryPersister,
	});
}
