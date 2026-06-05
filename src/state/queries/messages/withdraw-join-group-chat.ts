import type { ChatBskyGroupWithdrawJoinRequest } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

export function useWithdrawJoinGroupChatRequest({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: ChatBskyGroupWithdrawJoinRequest.$output) => void;
	onError?: (error: Error) => void;
} = {}) {
	const { chat } = useClients();

	return useMutation({
		mutationFn: async ({ convoId }: { convoId: string }) => {
			if (!chat) throw new Error('Must be logged in to withdraw a join request');
			if (!convoId) throw new Error('No convoId provided');
			return await ok(chat.post('chat.bsky.group.withdrawJoinRequest', { input: { convoId } }));
		},
		onSuccess: (data) => {
			onSuccess?.(data);
		},
		onError: (error) => {
			logger.error('Failed to withdraw join request', { safeMessage: error });
			onError?.(error);
		},
	});
}
