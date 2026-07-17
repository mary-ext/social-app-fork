import type { AppBskyActorSearchActors } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import {
	type InfiniteData,
	keepPreviousData,
	type QueryClient,
	type QueryKey,
	useInfiniteQuery,
} from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { STALE } from '#/state/queries';
import { useClients } from '#/state/session';

export const RQKEY_ROOT = 'actor-search';
export const RQKEY = (query: string, limit?: number) => [RQKEY_ROOT, query, limit];

export function useActorSearch({
	query,
	enabled,
	maintainData,
	limit = 25,
}: {
	query: string;
	enabled?: boolean;
	maintainData?: boolean;
	limit?: number;
}) {
	const { appview } = useClients();
	return useInfiniteQuery<
		AppBskyActorSearchActors.$output,
		Error,
		InfiniteData<AppBskyActorSearchActors.$output>,
		QueryKey,
		string | undefined
	>({
		staleTime: STALE.MINUTES.FIVE,
		queryKey: RQKEY(query, limit),
		queryFn: ({ pageParam }) =>
			ok(
				appview.get('app.bsky.actor.searchActors', {
					params: { cursor: pageParam, limit, q: query },
				}),
			),
		enabled: (enabled ?? true) && !!query,
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		placeholderData: maintainData ? keepPreviousData : undefined,
		select,
	});
}

function select(data: InfiniteData<AppBskyActorSearchActors.$output>) {
	// enforce uniqueness
	const dids = new Set();

	return {
		...data,
		pages: data.pages.map((page) => ({
			actors: page.actors.filter((actor) => {
				if (dids.has(actor.did)) {
					return false;
				}
				dids.add(actor.did);
				return true;
			}),
		})),
	};
}

export function* findAllProfilesInQueryData(queryClient: QueryClient, did: string) {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyActorSearchActors.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData) {
			continue;
		}
		for (const actor of queryData.pages.flatMap((page) => page.actors)) {
			if (actor.did === did) {
				yield actor;
			}
		}
	}
}

registerShadowFinders(RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
