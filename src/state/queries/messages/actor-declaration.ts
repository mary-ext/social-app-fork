import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteRecord, putRecord } from '#/lib/api/records';

import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { resolveAllowGroupInvites } from '#/components/dms/util';

import { RQKEY as PROFILE_RKEY } from '../profile';

export function useUpdateActorDeclaration({
	onSuccess,
	onError,
}: {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}) {
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();
	const { pds } = useClients();

	return useMutation({
		mutationFn: async (update: {
			allowIncoming?: 'all' | 'none' | 'following';
			allowGroupInvites?: 'all' | 'none' | 'following';
		}) => {
			if (!currentAccount || !pds) throw new Error('Not signed in');
			const current = queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(
				PROFILE_RKEY(currentAccount.did),
			);
			const allowIncoming = update.allowIncoming ?? current?.associated?.chat?.allowIncoming ?? 'following';
			const allowGroupInvites = resolveAllowGroupInvites({
				allowIncoming,
				allowGroupInvites: update.allowGroupInvites ?? current?.associated?.chat?.allowGroupInvites,
			});
			await putRecord(pds, {
				repo: currentAccount.did as Did,
				collection: 'chat.bsky.actor.declaration',
				rkey: 'self',
				record: {
					$type: 'chat.bsky.actor.declaration',
					allowIncoming,
					allowGroupInvites,
				},
			});
		},
		onMutate: (update) => {
			if (!currentAccount) return;
			queryClient.setQueryData(
				PROFILE_RKEY(currentAccount?.did),
				(old?: AppBskyActorDefs.ProfileViewDetailed) => {
					if (!old) return old;
					const allowIncoming =
						update.allowIncoming ?? old.associated?.chat?.allowIncoming ?? 'following';
					// resolve the same concrete value the server will receive, so
					// optimistic cache and persisted record stay aligned
					const allowGroupInvites = resolveAllowGroupInvites({
						allowIncoming,
						allowGroupInvites: update.allowGroupInvites ?? old.associated?.chat?.allowGroupInvites,
					});
					return {
						...old,
						associated: {
							...old.associated,
							chat: {
								...old.associated?.chat,
								allowIncoming,
								allowGroupInvites,
							},
						},
					} satisfies AppBskyActorDefs.ProfileViewDetailed;
				},
			);
		},
		onSuccess,
		onError: (error) => {
			logger.error(error);
			if (currentAccount) {
				void queryClient.invalidateQueries({
					queryKey: PROFILE_RKEY(currentAccount.did),
				});
			}
			onError?.(error);
		},
	});
}

// for use in the settings screen for testing
export function useDeleteActorDeclaration() {
	const { currentAccount } = useSession();
	const { pds } = useClients();

	return useMutation({
		mutationFn: async () => {
			if (!currentAccount || !pds) throw new Error('Not signed in');
			await deleteRecord(pds, {
				repo: currentAccount.did as Did,
				collection: 'chat.bsky.actor.declaration',
				rkey: 'self',
			});
		},
	});
}
