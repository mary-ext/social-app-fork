import type { ComAtprotoRepoApplyWrites } from '@atcute/atproto';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { chunked, mapDefined } from '@mary-ext/array-fns';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { listRecords } from '#/lib/api/records';

import { invalidateMyLists } from '#/state/queries/list/cache';
import { whenAppViewReady } from '#/state/queries/list/lib/when-app-view-ready';
import { PROFILE_LISTS_RQKEY } from '#/state/queries/profile/keys';
import { getClients, useSession } from '#/state/session';

const createDel = (recordUri: string): ComAtprotoRepoApplyWrites.$input['writes'][number] => {
	const urip = parseCanonicalResourceUri(recordUri);
	return {
		$type: 'com.atproto.repo.applyWrites#delete',
		collection: urip.collection,
		rkey: urip.rkey,
	};
};

export function useListDeleteMutation() {
	const { currentAccount } = useSession();
	const { appview, pds } = getClients();
	const queryClient = useQueryClient();
	return useMutation<void, Error, { uri: ResourceUri }>({
		mutationFn: async ({ uri }) => {
			if (!currentAccount) {
				return;
			}
			// fetch all the listitem records that belong to this list
			let cursor: string | undefined;
			let listitemRecordUris: string[] = [];
			for (let i = 0; i < 100; i++) {
				const res = await listRecords(pds!, {
					repo: currentAccount.did,
					collection: 'app.bsky.graph.listitem',
					cursor,
					limit: 100,
				});
				listitemRecordUris = listitemRecordUris.concat(
					mapDefined(res.records, (record) => (record.value.list === uri ? record.uri : undefined)),
				);
				cursor = res.cursor;
				if (!cursor) {
					break;
				}
			}

			// batch delete the list and listitem records
			const writes = listitemRecordUris.map((recordUri) => createDel(recordUri)).concat([createDel(uri)]);

			// apply in chunks
			for (const writesChunk of chunked(writes, 10)) {
				await ok(
					pds!.post('com.atproto.repo.applyWrites', {
						input: {
							repo: currentAccount.did,
							writes: writesChunk,
						},
					}),
				);
			}

			// wait for the appview to update (the list read fails once it's gone)
			await whenAppViewReady(appview, uri, (v) => {
				return !v;
			});
		},
		onSuccess() {
			invalidateMyLists(queryClient);
			void queryClient.invalidateQueries({
				queryKey: PROFILE_LISTS_RQKEY(currentAccount!.did),
			});
		},
	});
}
