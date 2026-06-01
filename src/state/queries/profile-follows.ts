import type { AppBskyActorDefs, AppBskyGraphGetFollows } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';
import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { useClients } from '#/state/session';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

// TODO refactor invalidate on mutate?
const RQKEY_ROOT = 'profile-follows';
export const RQKEY = (did: string) => [RQKEY_ROOT, did];

export function useProfileFollowsQuery(
	did: string | undefined,
	{
		limit,
	}: {
		limit?: number;
	} = {
		limit: PAGE_SIZE,
	},
) {
	const { appview } = useClients();
	return useInfiniteQuery<
		AppBskyGraphGetFollows.$output,
		Error,
		InfiniteData<AppBskyGraphGetFollows.$output>,
		QueryKey,
		RQPageParam
	>({
		staleTime: STALE.MINUTES.ONE,
		queryKey: RQKEY(did || ''),
		async queryFn({ pageParam }: { pageParam: RQPageParam }) {
			return await ok(
				appview.get('app.bsky.graph.getFollows', {
					params: {
						actor: (did || '') as ActorIdentifier,
						cursor: pageParam,
						limit: limit || PAGE_SIZE,
					},
				}),
			);
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		enabled: !!did,
	});
}

export function* findAllProfilesInQueryData(
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
		for (const page of queryData?.pages) {
			for (const follow of page.follows) {
				if (follow.did === did) {
					yield follow;
				}
			}
		}
	}
}
