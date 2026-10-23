import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { useQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { RQKEY } from '#/state/queries/list/keys';
import { getClients } from '#/state/session';

export function useListQuery(uri?: ResourceUri) {
	const { appview } = getClients();
	return useQuery<AppBskyGraphDefs.ListView>({
		queryKey: RQKEY(uri || ''),
		enabled: !!uri,
		staleTime: STALE.MINUTES.ONE,
		queryFn: async ({ signal }) => {
			if (!uri) {
				throw new Error('URI not provided');
			}
			const data = await ok(
				appview.get('app.bsky.graph.getList', {
					signal,
					params: { limit: 1, list: uri },
				}),
			);
			return data.list;
		},
	});
}
