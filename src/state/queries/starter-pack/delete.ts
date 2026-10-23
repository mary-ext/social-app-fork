import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteRecord } from '#/lib/api/records';
import { makeRecordUri } from '#/lib/at-uri';

import { invalidateListMembersQuery } from '#/state/queries/list/cache';
import { invalidateActorStarterPacksQuery, invalidateStarterPack } from '#/state/queries/starter-pack/cache';
import { whenAppViewReady } from '#/state/queries/starter-pack/lib/when-app-view-ready';
import { getClients, useSession } from '#/state/session';

export function useDeleteStarterPackMutation({
	onSuccess,
	onError,
}: {
	onSuccess: () => void;
	onError?: (error: Error) => void;
}) {
	const { appview, pds } = getClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ listUri, rkey }: { listUri?: string; rkey: string }) => {
			if (!currentAccount) {
				throw new Error(`Requires signed in user`);
			}

			if (listUri) {
				await deleteRecord(pds!, {
					repo: currentAccount.did,
					collection: 'app.bsky.graph.list',
					rkey: parseCanonicalResourceUri(listUri).rkey,
				});
			}
			await deleteRecord(pds!, {
				repo: currentAccount.did,
				collection: 'app.bsky.graph.starterpack',
				rkey,
			});
		},
		onSuccess: async (_, { listUri, rkey }) => {
			const uri = makeRecordUri(currentAccount!.did, 'app.bsky.graph.starterpack', rkey);

			if (uri) {
				// once the deletion is indexed, `getStarterPack` throws and the poll sees no response
				await whenAppViewReady(appview, uri, (v) => {
					return !v?.starterPack;
				});
			}

			if (listUri) {
				void invalidateListMembersQuery({ queryClient, uri: listUri });
			}
			await invalidateActorStarterPacksQuery({
				queryClient,
				did: currentAccount!.did,
			});
			await invalidateStarterPack({
				queryClient,
				did: currentAccount!.did,
				rkey,
			});
			onSuccess();
		},
		onError: (error) => {
			onError?.(error);
		},
	});
}
