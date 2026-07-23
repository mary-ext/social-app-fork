import type { ChatBskyGroupRequestJoin } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getClients } from '#/state/session';

import { logger } from '#/logger';

import { RQKEY_ROOT as CONVO_REQUEST_LIST_KEY } from './list-conversation-requests';

export function useRequestJoinGroupChat({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: ChatBskyGroupRequestJoin.$output) => void;
	onError?: (error: Error) => void;
} = {}) {
	const queryClient = useQueryClient();
	const { chat } = getClients();

	return useMutation({
		mutationFn: async ({ code }: { code: string }) => {
			if (!chat) {
				throw new Error('Must be logged in to join');
			}
			if (!code) {
				throw new Error('No invite code');
			}
			return await ok(chat.post('chat.bsky.group.requestJoin', { input: { code } }));
		},
		onSuccess: (data) => {
			// surface the new pending request in the outgoing-requests inbox
			void queryClient.invalidateQueries({ queryKey: [CONVO_REQUEST_LIST_KEY] });
			onSuccess?.(data);
		},
		onError: (error) => {
			logger.error('Failed to join group chat', { safeMessage: error });
			onError?.(error);
		},
	});
}
