import type { AppBskyActorDefs, AppBskyGraphDefs, AppBskyGraphGetList } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import {
	type InfiniteData,
	type QueryClient,
	type QueryKey,
	useInfiniteQuery,
	useQuery,
} from '@tanstack/react-query';

import { getAllListMembers } from '#/lib/api/list-members';
import { STALE } from '#/lib/query/const';

import { registerShadowFinders } from '#/state/cache/registry';
import {
	MEMBERS_ALL_RQKEY,
	MEMBERS_ALL_RQKEY_ROOT,
	MEMBERS_RQKEY,
	MEMBERS_RQKEY_ROOT,
} from '#/state/queries/list/keys';
import { getClients } from '#/state/session';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

export function useListMembersQuery(uri?: ResourceUri, limit: number = PAGE_SIZE) {
	const { appview } = getClients();
	return useInfiniteQuery<
		AppBskyGraphGetList.$output,
		Error,
		InfiniteData<AppBskyGraphGetList.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: MEMBERS_RQKEY(uri ?? ''),
		enabled: !!uri,
		staleTime: STALE.MINUTES.ONE,
		queryFn: ({ pageParam, signal }: { pageParam: RQPageParam; signal: AbortSignal }) =>
			ok(
				appview.get('app.bsky.graph.getList', {
					signal,
					params: {
						cursor: pageParam,
						limit,
						list: uri!,
					},
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

export function useAllListMembersQuery(uri?: ResourceUri) {
	const { appview } = getClients();
	return useQuery({
		queryKey: MEMBERS_ALL_RQKEY(uri ?? ''),
		enabled: !!uri,
		staleTime: STALE.MINUTES.ONE,
		queryFn: ({ signal }) => getAllListMembers(appview, uri!, signal),
	});
}

function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyGraphGetList.$output>>({
		queryKey: [MEMBERS_RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			if (page.list.creator.did === did) {
				yield page.list.creator;
			}
			for (const item of page.items) {
				if (item.subject.did === did) {
					yield item.subject;
				}
			}
		}
	}

	const allQueryData = queryClient.getQueriesData<AppBskyGraphDefs.ListItemView[]>({
		queryKey: [MEMBERS_ALL_RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of allQueryData) {
		if (!queryData) {
			continue;
		}
		for (const item of queryData) {
			if (item.subject.did === did) {
				yield item.subject;
			}
		}
	}
}

registerShadowFinders(MEMBERS_RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
