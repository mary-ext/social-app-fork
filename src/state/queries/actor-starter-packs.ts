import { ok } from '@atcute/client';
import { type ActorIdentifier } from '@atcute/lexicons';
import { type QueryClient, useInfiniteQuery } from '@tanstack/react-query';

import { useClients } from '#/state/session';

export const RQKEY_ROOT = 'actor-starter-packs';
export const RQKEY_WITH_MEMBERSHIP_ROOT = 'actor-starter-packs-with-membership';
export const RQKEY = (did?: string) => [RQKEY_ROOT, did];
export const RQKEY_WITH_MEMBERSHIP = (did?: string) => [RQKEY_WITH_MEMBERSHIP_ROOT, did];

export function useActorStarterPacksQuery({ did, enabled = true }: { did?: string; enabled?: boolean }) {
	const { appview } = useClients();

	return useInfiniteQuery({
		queryKey: RQKEY(did),
		queryFn: ({ pageParam }: { pageParam?: string }) =>
			ok(
				appview.get('app.bsky.graph.getActorStarterPacks', {
					params: { actor: did! as ActorIdentifier, cursor: pageParam, limit: 10 },
				}),
			),
		enabled: Boolean(did) && enabled,
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

export function useActorStarterPacksWithMembershipsQuery({
	did,
	enabled = true,
}: {
	did?: string;
	enabled?: boolean;
}) {
	const { appview } = useClients();

	return useInfiniteQuery({
		queryKey: RQKEY_WITH_MEMBERSHIP(did),
		queryFn: ({ pageParam }: { pageParam?: string }) =>
			ok(
				appview.get('app.bsky.graph.getStarterPacksWithMembership', {
					params: { actor: did! as ActorIdentifier, cursor: pageParam, limit: 10 },
				}),
			),
		enabled: Boolean(did) && enabled,
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

export async function invalidateActorStarterPacksQuery({
	queryClient,
	did,
}: {
	queryClient: QueryClient;
	did: string;
}) {
	await queryClient.invalidateQueries({ queryKey: RQKEY(did) });
}

export async function invalidateActorStarterPacksWithMembershipQuery({
	queryClient,
	did,
}: {
	queryClient: QueryClient;
	did: string;
}) {
	await queryClient.invalidateQueries({ queryKey: RQKEY_WITH_MEMBERSHIP(did) });
}
