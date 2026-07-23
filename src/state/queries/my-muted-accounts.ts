import type { AppBskyActorDefs, AppBskyGraphGetMutes } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { getClients } from '#/state/session';

const RQKEY_ROOT = 'my-muted-accounts';
export const RQKEY = () => [RQKEY_ROOT];
type RQPageParam = string | undefined;

export function useMyMutedAccountsQuery() {
	const { appview } = getClients();
	return useInfiniteQuery<
		AppBskyGraphGetMutes.$output,
		Error,
		InfiniteData<AppBskyGraphGetMutes.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(),
		async queryFn({ pageParam }: { pageParam: RQPageParam }) {
			return await ok(
				appview.get('app.bsky.graph.getMutes', {
					params: { cursor: pageParam, limit: 30 },
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
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyGraphGetMutes.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const mute of page.mutes) {
				if (mute.did === did) {
					yield mute;
				}
			}
		}
	}
}

registerShadowFinders(RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
