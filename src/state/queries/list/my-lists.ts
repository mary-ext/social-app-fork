import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';
import { accumulate } from '#/lib/utils/accumulate';

import { MY_LISTS_RQKEY } from '#/state/queries/list/keys';
import { getClients, useSession } from '#/state/session';

export type MyListsFilter = 'all' | 'curate' | 'mod' | 'all-including-subscribed';

export function useMyListsQuery(filter: MyListsFilter) {
	const { currentAccount } = useSession();
	const { appview } = getClients();
	return useQuery<AppBskyGraphDefs.ListView[]>({
		queryKey: MY_LISTS_RQKEY(filter),
		enabled: !!currentAccount,
		staleTime: STALE.MINUTES.ONE,
		async queryFn({ signal }) {
			const lists: AppBskyGraphDefs.ListView[] = [];
			const promises: Promise<AppBskyGraphDefs.ListView[]>[] = [
				accumulate((cursor) =>
					ok(
						appview.get('app.bsky.graph.getLists', {
							signal,
							params: { actor: currentAccount!.did, cursor, limit: 50 },
						}),
					).then((data) => ({ cursor: data.cursor, items: data.lists })),
				),
			];
			if (filter === 'all-including-subscribed' || filter === 'mod') {
				promises.push(
					accumulate((cursor) =>
						ok(appview.get('app.bsky.graph.getListMutes', { signal, params: { cursor, limit: 50 } })).then(
							(data) => ({
								cursor: data.cursor,
								items: data.lists,
							}),
						),
					),
				);
				promises.push(
					accumulate((cursor) =>
						ok(appview.get('app.bsky.graph.getListBlocks', { signal, params: { cursor, limit: 50 } })).then(
							(data) => ({ cursor: data.cursor, items: data.lists }),
						),
					),
				);
			}
			const resultset = await Promise.all(promises);
			for (const res of resultset) {
				for (const list of res) {
					if (filter === 'curate' && list.purpose !== 'app.bsky.graph.defs#curatelist') {
						continue;
					}
					if (filter === 'mod' && list.purpose !== 'app.bsky.graph.defs#modlist') {
						continue;
					}
					if (!lists.find((l) => l.uri === list.uri)) {
						lists.push(list);
					}
				}
			}
			return lists;
		},
	});
}
