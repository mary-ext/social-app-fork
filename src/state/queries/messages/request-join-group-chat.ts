import type { ChatBskyGroupRequestJoin } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

export function useRequestJoinGroupChat({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: ChatBskyGroupRequestJoin.$output) => void;
	onError?: (error: Error) => void;
} = {}) {
	const { chat } = useClients();

	return useMutation({
		mutationFn: async ({ code }: { code: string }) => {
			if (!chat) throw new Error('Must be logged in to join');
			if (!code) throw new Error('No invite code');
			return await ok(chat.post('chat.bsky.group.requestJoin', { input: { code } }));
		},
		onSuccess: (data) => {
			onSuccess?.(data);
		},
		onError: (error) => {
			logger.error('Failed to join group chat', { safeMessage: error });
			onError?.(error);
		},
	});
}
