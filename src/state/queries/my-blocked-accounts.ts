import type { AppBskyActorDefs, AppBskyGraphGetBlocks } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { getClients } from '#/state/session';

const RQKEY_ROOT = 'my-blocked-accounts';
export const RQKEY = () => [RQKEY_ROOT];
type RQPageParam = string | undefined;

export function useMyBlockedAccountsQuery() {
	const { appview } = getClients();
	return useInfiniteQuery<
		AppBskyGraphGetBlocks.$output,
		Error,
		InfiniteData<AppBskyGraphGetBlocks.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(),
		async queryFn({ pageParam }: { pageParam: RQPageParam }) {
			return await ok(
				appview.get('app.bsky.graph.getBlocks', {
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
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyGraphGetBlocks.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const block of page.blocks) {
				if (block.did === did) {
					yield block;
				}
			}
		}
	}
}

registerShadowFinders(RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
