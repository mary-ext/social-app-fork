import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type QueryClient, useInfiniteQuery } from '@tanstack/react-query';

import { getClients } from '#/state/session';

export const RQKEY_ROOT = 'actor-starter-packs';
export const RQKEY_WITH_MEMBERSHIP_ROOT = 'actor-starter-packs-with-membership';
export const RQKEY = (did?: string) => [RQKEY_ROOT, did];
export const RQKEY_WITH_MEMBERSHIP = (did?: string) => [RQKEY_WITH_MEMBERSHIP_ROOT, did];

export function useActorStarterPacksQuery({ did, enabled = true }: { did?: Did; enabled?: boolean }) {
	const { appview } = getClients();

	return useInfiniteQuery({
		queryKey: RQKEY(did),
		enabled: !!did && enabled,
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
		queryKey: RQKEY_WITH_MEMBERSHIP(did),
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

export async function invalidateActorStarterPacksQuery({
	queryClient,
	did,
}: {
	queryClient: QueryClient;
	did: string;
}) {
	await queryClient.invalidateQueries({ queryKey: RQKEY(did) });
}
