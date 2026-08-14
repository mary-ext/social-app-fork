import type { AppBskyActorDefs, AppBskyGraphGetFollowers } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { getClients } from '#/state/session';

const DEFAULT_SORT = 'latest';
const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

const RQKEY_ROOT = 'profile-followers';
// the sort is part of the key: the two orderings are different lists and must not share pages.
export const RQKEY = (did: string, sort: 'latest' | 'top' = DEFAULT_SORT) => [RQKEY_ROOT, did, sort];

export function useProfileFollowersQuery(
	did: Did | undefined,
	{
		sort = DEFAULT_SORT,
	}: {
		sort?: 'latest' | 'top';
	} = {},
) {
	const { appview } = getClients();
	return useInfiniteQuery<
		AppBskyGraphGetFollowers.$output,
		Error,
		InfiniteData<AppBskyGraphGetFollowers.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(did || '', sort),
		enabled: !!did,
		async queryFn({ pageParam, signal }: { pageParam: RQPageParam; signal: AbortSignal }) {
			return await ok(
				appview.get('app.bsky.graph.getFollowers', {
					signal,
					params: {
						actor: did!,
						cursor: pageParam,
						limit: PAGE_SIZE,
						sort,
					},
				}),
			);
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyGraphGetFollowers.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const follower of page.followers) {
				if (follower.did === did) {
					yield follower;
				}
			}
		}
	}
}

registerShadowFinders(RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
