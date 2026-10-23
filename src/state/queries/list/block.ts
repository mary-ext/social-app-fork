import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';

import { RQKEY } from '#/state/queries/list/keys';
import { whenAppViewReady } from '#/state/queries/list/lib/when-app-view-ready';
import { getClients, useSession } from '#/state/session';

export function useListBlockMutation() {
	const { currentAccount } = useSession();
	const { appview, pds } = getClients();
	const queryClient = useQueryClient();
	return useMutation<void, Error, { uri: ResourceUri; block: boolean }>({
		mutationFn: async ({ uri, block }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			if (block) {
				await createRecord(pds!, {
					repo: currentAccount.did,
					record: {
						$type: 'app.bsky.graph.listblock',
						createdAt: new Date().toISOString(),
						subject: uri,
					},
				});
			} else {
				const data = await ok(
					appview.get('app.bsky.graph.getList', {
						params: { limit: 1, list: uri },
					}),
				);
				const blocked = data.list.viewer?.blocked;
				if (blocked) {
					await deleteRecord(pds!, {
						repo: currentAccount.did,
						collection: 'app.bsky.graph.listblock',
						rkey: parseCanonicalResourceUri(blocked).rkey,
					});
				}
			}

			await whenAppViewReady(appview, uri, (v) => {
				return block ? typeof v?.viewer?.blocked === 'string' : !v?.viewer?.blocked;
			});
		},
		onSuccess(_data, variables) {
			void queryClient.invalidateQueries({
				queryKey: RQKEY(variables.uri),
			});
		},
	});
}
