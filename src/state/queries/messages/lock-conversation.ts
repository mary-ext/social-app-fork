import type { ChatBskyConvoLockConvo } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { rollbackConvoOptimistic, updateConvoOptimistic } from './utils/convo-cache';

export function useLockConvo(
	convoId: string | undefined,
	{
		onSuccess,
		onError,
	}: {
		onSuccess?: (
			data: ChatBskyConvoLockConvo.$output,
			variables: { lock: boolean; silent?: boolean },
		) => void;
		onError?: (error: Error, variables: { lock: boolean; silent?: boolean }) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async ({ lock }: { lock: boolean; silent?: boolean }) => {
			if (!convoId) {
				throw new Error('No convoId provided');
			}
			if (!chat) {
				throw new Error('Not signed in');
			}
			if (lock) {
				const data = await ok(
					chat.post('chat.bsky.convo.lockConvo', {
						input: { convoId },
					}),
				);
				return data;
			} else {
				const data = await ok(
					chat.post('chat.bsky.convo.unlockConvo', {
						input: { convoId },
					}),
				);
				return data;
			}
		},
		onMutate: ({ lock }) => {
			if (!convoId) {
				return;
			}
			return updateConvoOptimistic(queryClient, convoId, (prev) => {
				if (prev.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') {
					return undefined;
				}
				return {
					...prev,
					kind: {
						...prev.kind,
						lockStatus: lock ? 'locked' : 'unlocked',
					},
				};
			});
		},
		onSuccess: (data, variables) => {
			onSuccess?.(data, variables);
		},
		onError: (e, variables, context) => {
			if (convoId && context) {
				rollbackConvoOptimistic(queryClient, convoId, context);
			}
			onError?.(e, variables);
		},
	});
}
