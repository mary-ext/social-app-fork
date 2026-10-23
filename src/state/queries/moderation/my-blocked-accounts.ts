import type { AppBskyActorDefs, AppBskyGraphGetBlocks } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import {
	MY_BLOCKED_ACCOUNTS_RQKEY_ROOT as RQKEY_ROOT,
	RQKEY_MY_BLOCKED as RQKEY,
} from '#/state/queries/moderation/keys';
import { getClients } from '#/state/session';

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
		async queryFn({ pageParam, signal }: { pageParam: RQPageParam; signal: AbortSignal }) {
			return await ok(
				appview.get('app.bsky.graph.getBlocks', {
					signal,
					params: { cursor: pageParam, limit: 30 },
				}),
			);
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

function* findAllProfilesInQueryData(
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
