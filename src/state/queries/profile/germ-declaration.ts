import type { Did } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteRecord, getRecord, putRecord } from '#/lib/api/records';

import { profileQueryKey } from '#/state/queries/profile/keys';
import { whenProfileViewReady } from '#/state/queries/profile/lib/when-profile-view-ready';
import { getClients } from '#/state/session';

/**
 * deletes the account's Germ DM declaration, then polls the AppView until the link disappears.
 *
 * @param did the account, which must be the signed-in one
 * @param onSuccess called after deletion with a function that restores the deleted declaration and resolves
 *   once the AppView reflects it, or undefined if there was no declaration to restore
 * @param onError called when deletion fails
 * @returns the mutation
 */
export function useDeleteGermDeclarationMutation({
	did,
	onSuccess,
	onError,
}: {
	did: Did;
	onSuccess: (restore: (() => Promise<void>) | undefined) => void;
	onError: (err: Error) => void;
}) {
	const { appview, pds } = getClients();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const previousRecord = await getRecord(pds!, {
				repo: did,
				collection: 'com.germnetwork.declaration',
				rkey: 'self',
			})
				.then((res) => res.value)
				.catch(() => null);

			await deleteRecord(pds!, {
				repo: did,
				collection: 'com.germnetwork.declaration',
				rkey: 'self',
			});

			await whenProfileViewReady(appview, did, (res) => !res.associated?.germ);

			return previousRecord;
		},
		onSuccess: (previousRecord) => {
			let restore: (() => Promise<void>) | undefined;
			if (previousRecord) {
				restore = async () => {
					await putRecord(pds!, {
						repo: did,
						rkey: 'self',
						record: previousRecord,
					});
					await whenProfileViewReady(appview, did, (res) => !!res.associated?.germ);
					await queryClient.refetchQueries({ queryKey: profileQueryKey(did) });
				};
			}

			void queryClient.refetchQueries({ queryKey: profileQueryKey(did) });
			onSuccess(restore);
		},
		onError,
	});
}
