import type { ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createListItemWrite, getAllListMembers } from '#/lib/api/list-members';
import { applyWrites } from '#/lib/bulk-write-follows';
import { STALE } from '#/lib/query/const';

import { invalidateListMembersQuery } from '#/state/queries/list/cache';
import { MEMBERS_ALL_RQKEY, RQKEY } from '#/state/queries/list/keys';
import { whenAppViewReady } from '#/state/queries/list/lib/when-app-view-ready';
import { getClients, useSession } from '#/state/session';

/**
 * copies a list's members into one of the current account's lists.
 *
 * see {@link getAllListMembers} for fetch limits and {@link applyWrites} for behavior on failure. invalidates
 * the target list's cache on success or failure.
 *
 * @param onError called when the copy fails, even if the calling component has unmounted
 * @returns the mutation, taking the source and target list URIs
 */
export function useCopyListMembersMutation({ onError }: { onError: (error: Error) => void }) {
	const { currentAccount } = useSession();
	const { appview, pds } = getClients();
	const queryClient = useQueryClient();

	return useMutation<void, Error, { fromUri: ResourceUri; toUri: ResourceUri }>({
		async mutationFn({ fromUri, toUri }) {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}

			const items = await queryClient.fetchQuery({
				queryKey: MEMBERS_ALL_RQKEY(fromUri),
				staleTime: STALE.MINUTES.ONE,
				queryFn: ({ signal }) => getAllListMembers(appview, fromUri, signal),
			});
			if (items.length === 0) {
				return;
			}

			await applyWrites(
				pds!,
				currentAccount.did,
				items.map((item) => createListItemWrite({ did: item.subject.did, listUri: toUri })),
			);
			await whenAppViewReady(appview, toUri, (v) => (v?.listItemCount ?? 0) > 0);
		},
		onError,
		onSettled(_data, _error, { toUri }) {
			void queryClient.invalidateQueries({ queryKey: RQKEY(toUri) });
			void invalidateListMembersQuery({ queryClient, uri: toUri });
		},
	});
}
