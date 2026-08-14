import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { useQuery } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { getClients } from '#/state/session';

const RQKEY_ROOT = 'relationship';
const RQKEY = (actor: string, other: string) => [RQKEY_ROOT, actor, other];

/**
 * queries the relationship from `actor` to `other`.
 *
 * @param actor source account
 * @param other target account
 * @returns relationship query
 */
export function useRelationshipQuery({ actor, other }: { actor: Did | undefined; other: Did | undefined }) {
	const { appview } = getClients();

	return useQuery({
		queryKey: RQKEY(actor ?? '', other ?? ''),
		enabled: !!actor && !!other,
		staleTime: STALE.MINUTES.FIVE,
		queryFn: async ({ signal }): Promise<AppBskyGraphDefs.Relationship | undefined> => {
			const { relationships } = await ok(
				appview.get('app.bsky.graph.getRelationships', {
					signal,
					params: {
						actor: actor!,
						others: [other!],
					},
				}),
			);

			const [relationship] = relationships;
			return relationship?.$type === 'app.bsky.graph.defs#relationship' ? relationship : undefined;
		},
	});
}
