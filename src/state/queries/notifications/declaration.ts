import type { AppBskyNotificationDeclaration } from '@atcute/bluesky';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getRecord, putRecord } from '#/lib/api/records';
import { isRecordNotFoundError } from '#/lib/errors';

import { getClients, useSession } from '#/state/session';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

const RQKEY_getNotificationDeclaration = ['notification-declaration'];

export function useNotificationDeclarationQuery() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useQuery({
		queryKey: RQKEY_getNotificationDeclaration,
		queryFn: async ({ signal }) => {
			try {
				return await getRecord(pds!, {
					signal,
					repo: currentAccount!.did,
					collection: 'app.bsky.notification.declaration',
					rkey: 'self',
				});
			} catch (err) {
				if (isRecordNotFoundError(err)) {
					return {
						value: {
							$type: 'app.bsky.notification.declaration',
							allowSubscriptions: 'followers',
						} satisfies AppBskyNotificationDeclaration.Main,
					};
				} else {
					throw err;
				}
			}
		},
	});
}

export function useNotificationDeclarationMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (record: AppBskyNotificationDeclaration.Main) => {
			return await putRecord(pds!, {
				repo: currentAccount!.did,
				rkey: 'self',
				record,
			});
		},
		onMutate: (value) => {
			queryClient.setQueryData(
				RQKEY_getNotificationDeclaration,
				(old?: { uri: string; cid: string; value: AppBskyNotificationDeclaration.Main }) => {
					if (!old) {
						return old;
					}
					return {
						...old,
						value,
					};
				},
			);
		},
		onError: () => {
			Toast.show(m['state.notifications.error.declarationUpdate']());
			void queryClient.invalidateQueries({
				queryKey: RQKEY_getNotificationDeclaration,
			});
		},
	});
}
