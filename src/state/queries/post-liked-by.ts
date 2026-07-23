import type { AppBskyActorDefs, AppBskyFeedGetLikes } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { getClients } from '#/state/session';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

// TODO refactor invalidate on mutate?
const RQKEY_ROOT = 'liked-by';
export const RQKEY = (resolvedUri: string) => [RQKEY_ROOT, resolvedUri];

export function useLikedByQuery(resolvedUri: ResourceUri | undefined) {
	const { appview } = getClients();
	return useInfiniteQuery<
		AppBskyFeedGetLikes.$output,
		Error,
		InfiniteData<AppBskyFeedGetLikes.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(resolvedUri || ''),
		queryFn: ({ pageParam }: { pageParam: RQPageParam }) =>
			ok(
				appview.get('app.bsky.feed.getLikes', {
					params: {
						cursor: pageParam,
						limit: PAGE_SIZE,
						uri: resolvedUri!,
					},
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		enabled: !!resolvedUri,
	});
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedGetLikes.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const like of page.likes) {
				if (like.actor.did === did) {
					yield like.actor;
				}
			}
		}
	}
}

registerShadowFinders(RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
