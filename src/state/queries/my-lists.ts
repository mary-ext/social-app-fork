import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type QueryClient, useQuery } from '@tanstack/react-query';

import { accumulate } from '#/lib/async/accumulate';

import { STALE } from '#/state/queries';
import { useClients, useSession } from '#/state/session';

export type MyListsFilter = 'all' | 'curate' | 'mod' | 'all-including-subscribed';

const RQKEY_ROOT = 'my-lists';
export const RQKEY = (filter: MyListsFilter) => [RQKEY_ROOT, filter];

export function useMyListsQuery(filter: MyListsFilter) {
	const { currentAccount } = useSession();
	const { appview } = useClients();
	return useQuery<AppBskyGraphDefs.ListView[]>({
		staleTime: STALE.MINUTES.ONE,
		queryKey: RQKEY(filter),
		async queryFn() {
			const lists: AppBskyGraphDefs.ListView[] = [];
			const promises: Promise<AppBskyGraphDefs.ListView[]>[] = [
				accumulate((cursor) =>
					ok(
						appview.get('app.bsky.graph.getLists', {
							params: { actor: currentAccount!.did, cursor, limit: 50 },
						}),
					).then((data) => ({ cursor: data.cursor, items: data.lists })),
				),
			];
			if (filter === 'all-including-subscribed' || filter === 'mod') {
				promises.push(
					accumulate((cursor) =>
						ok(appview.get('app.bsky.graph.getListMutes', { params: { cursor, limit: 50 } })).then(
							(data) => ({
								cursor: data.cursor,
								items: data.lists,
							}),
						),
					),
				);
				promises.push(
					accumulate((cursor) =>
						ok(appview.get('app.bsky.graph.getListBlocks', { params: { cursor, limit: 50 } })).then(
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
		enabled: !!currentAccount,
	});
}

export function invalidate(qc: QueryClient, filter?: MyListsFilter) {
	if (filter) {
		void qc.invalidateQueries({ queryKey: RQKEY(filter) });
	} else {
		void qc.invalidateQueries({ queryKey: [RQKEY_ROOT] });
	}
}
