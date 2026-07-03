import type { AppBskyActorDefs, AppBskyGraphDefs, AppBskyGraphGetList } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import {
	type InfiniteData,
	type QueryClient,
	type QueryKey,
	useInfiniteQuery,
	useQuery,
} from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { useClients } from '#/state/session';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

const RQKEY_ROOT = 'list-members';
const RQKEY_ROOT_ALL = 'list-members-all';
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri];
export const RQKEY_ALL = (uri: string) => [RQKEY_ROOT_ALL, uri];

export function useListMembersQuery(uri?: string, limit: number = PAGE_SIZE) {
	const { appview } = useClients();
	return useInfiniteQuery<
		AppBskyGraphGetList.$output,
		Error,
		InfiniteData<AppBskyGraphGetList.$output>,
		QueryKey,
		RQPageParam
	>({
		staleTime: STALE.MINUTES.ONE,
		queryKey: RQKEY(uri ?? ''),
		queryFn: ({ pageParam }: { pageParam: RQPageParam }) =>
			ok(
				appview.get('app.bsky.graph.getList', {
					params: {
						cursor: pageParam,
						limit,
						list: uri! as ResourceUri, // the enabled flag will prevent this from running until uri is set
					},
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		enabled: Boolean(uri),
	});
}

export function useAllListMembersQuery(uri?: string) {
	const { appview } = useClients();
	return useQuery({
		staleTime: STALE.MINUTES.ONE,
		queryKey: RQKEY_ALL(uri ?? ''),
		queryFn: () => getAllListMembers(appview, uri!),
		enabled: Boolean(uri),
	});
}

export async function getAllListMembers(client: Client, uri: string) {
	let hasMore = true;
	let cursor: string | undefined;
	const listItems: AppBskyGraphDefs.ListItemView[] = [];
	// We want to cap this at 6 pages, just for anything weird happening with the api
	let i = 0;
	while (hasMore && i < 6) {
		const data = await ok(
			client.get('app.bsky.graph.getList', {
				params: { cursor, limit: 50, list: uri as ResourceUri },
			}),
		);
		listItems.push(...data.items);
		hasMore = Boolean(data.cursor);
		cursor = data.cursor;
		i++;
	}
	return listItems;
}

export async function invalidateListMembersQuery({
	queryClient,
	uri,
}: {
	queryClient: QueryClient;
	uri: string;
}) {
	await queryClient.invalidateQueries({ queryKey: RQKEY(uri) });
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyGraphGetList.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData?.pages) {
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
		queryKey: [RQKEY_ROOT_ALL],
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
