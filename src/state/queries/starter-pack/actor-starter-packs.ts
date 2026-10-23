import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { useInfiniteQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { ACTOR_RQKEY, ACTOR_WITH_MEMBERSHIP_RQKEY } from '#/state/queries/starter-pack/keys';
import { getClients } from '#/state/session';

export function useActorStarterPacksQuery({ did, enabled = true }: { did?: Did; enabled?: boolean }) {
	const { appview } = getClients();

	return useInfiniteQuery({
		queryKey: ACTOR_RQKEY(did),
		enabled: !!did && enabled,
		staleTime: STALE.MINUTES.ONE,
		queryFn: ({ pageParam, signal }: { pageParam?: string; signal: AbortSignal }) =>
			ok(
				appview.get('app.bsky.graph.getActorStarterPacks', {
					signal,
					params: { actor: did!, cursor: pageParam, limit: 10 },
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

export function useActorStarterPacksWithMembershipsQuery({
	did,
	enabled = true,
}: {
	did?: Did;
	enabled?: boolean;
}) {
	const { appview } = getClients();

	return useInfiniteQuery({
		queryKey: ACTOR_WITH_MEMBERSHIP_RQKEY(did),
		enabled: !!did && enabled,
		queryFn: ({ pageParam, signal }: { pageParam?: string; signal: AbortSignal }) =>
			ok(
				appview.get('app.bsky.graph.getStarterPacksWithMembership', {
					signal,
					params: { actor: did!, cursor: pageParam, limit: 10 },
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}
