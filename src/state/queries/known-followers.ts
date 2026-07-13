import type { AppBskyActorDefs, AppBskyGraphGetKnownFollowers } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { useClients } from '#/state/session';

const PAGE_SIZE = 50;
type RQPageParam = string | undefined;

const RQKEY_ROOT = 'profile-known-followers';
export const RQKEY = (did: string) => [RQKEY_ROOT, did];

export function useProfileKnownFollowersQuery(did: string | undefined) {
	const { appview } = useClients();
	return useInfiniteQuery<
		AppBskyGraphGetKnownFollowers.$output,
		Error,
		InfiniteData<AppBskyGraphGetKnownFollowers.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(did || ''),
		async queryFn({ pageParam }: { pageParam: RQPageParam }) {
			return await ok(
				appview.get('app.bsky.graph.getKnownFollowers', {
					params: {
						actor: did! as ActorIdentifier,
						cursor: pageParam,
						limit: PAGE_SIZE,
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
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyGraphGetKnownFollowers.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const follow of page.followers) {
				if (follow.did === did) {
					yield follow;
				}
			}
		}
	}
}
