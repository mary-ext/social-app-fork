import { type AppBskyActorDefs, type AppBskyFeedGetRepostedBy } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type ResourceUri } from '@atcute/lexicons';
import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { useClients } from '#/state/session';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

// TODO refactor invalidate on mutate?
const RQKEY_ROOT = 'post-reposted-by';
export const RQKEY = (resolvedUri: string) => [RQKEY_ROOT, resolvedUri];

export function usePostRepostedByQuery(resolvedUri: string | undefined) {
	const { appview } = useClients();
	return useInfiniteQuery<
		AppBskyFeedGetRepostedBy.$output,
		Error,
		InfiniteData<AppBskyFeedGetRepostedBy.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(resolvedUri || ''),
		queryFn: ({ pageParam }: { pageParam: RQPageParam }) =>
			ok(
				appview.get('app.bsky.feed.getRepostedBy', {
					params: {
						cursor: pageParam,
						limit: PAGE_SIZE,
						uri: (resolvedUri || '') as ResourceUri,
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
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyFeedGetRepostedBy.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData?.pages) {
			for (const repostedBy of page.repostedBy) {
				if (repostedBy.did === did) {
					yield repostedBy;
				}
			}
		}
	}
}
