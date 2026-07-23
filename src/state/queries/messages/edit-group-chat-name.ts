import type { ChatBskyGroupEditGroup } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getClients } from '#/state/session';

import { logger } from '#/logger';

import { rollbackConvoOptimistic, updateConvoOptimistic } from './utils/convo-cache';

export function useEditGroupChatName(
	convoId: string | undefined,
	{
		onSuccess,
		onError,
	}: {
		onSuccess?: (data: ChatBskyGroupEditGroup.$output) => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = getClients();

	return useMutation({
		mutationFn: async ({ name: groupName }: { name: string }) => {
			if (!convoId) {
				throw new Error('No convoId provided');
			}
			if (!chat) {
				throw new Error('Not signed in');
			}
			const data = await ok(
				chat.post('chat.bsky.group.editGroup', {
					input: { convoId, name: groupName },
				}),
			);
			return data;
		},
		onMutate: ({ name: groupName }) => {
			if (!convoId) {
				return;
			}
			return updateConvoOptimistic(queryClient, convoId, (prev) => {
				if (prev.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') {
					return undefined;
				}
				return {
					...prev,
					kind: { ...prev.kind, name: groupName },
				};
			});
		},
		onSuccess: (data) => {
			onSuccess?.(data);
		},
		onError: (e, _variables, context) => {
			logger.error(e);
			if (convoId && context) {
				rollbackConvoOptimistic(queryClient, convoId, context);
			}
			onError?.(e);
		},
	});
}
