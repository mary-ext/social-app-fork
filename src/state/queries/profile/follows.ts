import type { AppBskyActorDefs, AppBskyGraphGetFollows } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { registerShadowFinders } from '#/state/cache/registry';
import {
	PROFILE_FOLLOWS_RQKEY as RQKEY,
	PROFILE_FOLLOWS_RQKEY_ROOT as RQKEY_ROOT,
} from '#/state/queries/profile/keys';
import { getClients } from '#/state/session';

const DEFAULT_SORT = 'latest';
const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

// a moving follow list can repeat a profile across pages; dedupe before consumers flatten the data.
const dedupeFollows = (
	data: InfiniteData<AppBskyGraphGetFollows.$output>,
): InfiniteData<AppBskyGraphGetFollows.$output> => {
	const seen = new Set<string>();
	return {
		...data,
		pages: data.pages.map((page) => ({
			...page,
			follows: page.follows.filter((profile) => {
				if (seen.has(profile.did)) {
					return false;
				}
				seen.add(profile.did);
				return true;
			}),
		})),
	};
};

export function useProfileFollowsQuery(
	did: Did | undefined,
	{
		limit,
		sort = DEFAULT_SORT,
	}: {
		limit?: number;
		sort?: 'latest' | 'top';
	} = {},
) {
	const { appview } = getClients();
	return useInfiniteQuery<
		AppBskyGraphGetFollows.$output,
		Error,
		InfiniteData<AppBskyGraphGetFollows.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(did || '', sort),
		enabled: !!did,
		staleTime: STALE.MINUTES.ONE,
		async queryFn({ pageParam, signal }: { pageParam: RQPageParam; signal: AbortSignal }) {
			return await ok(
				appview.get('app.bsky.graph.getFollows', {
					signal,
					params: {
						actor: did!,
						cursor: pageParam,
						limit: limit || PAGE_SIZE,
						sort,
					},
				}),
			);
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		select: dedupeFollows,
	});
}

function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyGraphGetFollows.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const follow of page.follows) {
				if (follow.did === did) {
					yield follow;
				}
			}
		}
	}
}

registerShadowFinders(RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
