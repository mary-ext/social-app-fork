import type { AppBskyGraphSearchStarterPacksV2 } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type InfiniteData, keepPreviousData, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { getClients } from '#/state/session';

export const RQKEY_ROOT = 'starter-pack-search';
export const RQKEY = (query: string, limit?: number) => [RQKEY_ROOT, query, limit];

export function useStarterPackSearch({
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
	const { appview } = getClients();
	return useInfiniteQuery<
		AppBskyGraphSearchStarterPacksV2.$output,
		Error,
		InfiniteData<AppBskyGraphSearchStarterPacksV2.$output>,
		QueryKey,
		string | undefined
	>({
		queryKey: RQKEY(query, limit),
		enabled: (enabled ?? true) && !!query,
		staleTime: STALE.MINUTES.FIVE,
		queryFn: ({ pageParam }) =>
			ok(
				appview.get('app.bsky.graph.searchStarterPacksV2', {
					params: { cursor: pageParam, limit, q: query },
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		placeholderData: maintainData ? keepPreviousData : undefined,
		select,
	});
}

function select(data: InfiniteData<AppBskyGraphSearchStarterPacksV2.$output>) {
	// enforce uniqueness
	const uris = new Set();

	return {
		...data,
		pages: data.pages.map((page) => ({
			starterPacks: page.starterPacks.filter((starterPack) => {
				if (uris.has(starterPack.uri)) {
					return false;
				}
				uris.add(starterPack.uri);
				return true;
			}),
		})),
	};
}
