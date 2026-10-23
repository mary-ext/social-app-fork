import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { useQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';
import { httpStarterPackUriToAtUri } from '#/lib/starter-pack';

import { RQKEY } from '#/state/queries/starter-pack/cache';
import { getClients } from '#/state/session';

export function useStarterPackQuery({ uri, did, rkey }: { uri?: string; did?: string; rkey?: string }) {
	const { appview } = getClients();

	return useQuery<AppBskyGraphDefs.StarterPackView>({
		queryKey: RQKEY(uri ? { uri } : { did, rkey }),
		enabled: !!uri || !!(did && rkey),
		staleTime: STALE.MINUTES.FIVE,
		queryFn: async ({ signal }) => {
			const resolvedUri = !uri
				? `at://${did}/app.bsky.graph.starterpack/${rkey}`
				: uri.startsWith('at://')
					? uri
					: httpStarterPackUriToAtUri(uri);

			const data = await ok(
				appview.get('app.bsky.graph.getStarterPack', {
					signal,
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- built from the route params `enabled` gates this query on
					params: { starterPack: resolvedUri as ResourceUri },
				}),
			);
			return data.starterPack;
		},
	});
}
