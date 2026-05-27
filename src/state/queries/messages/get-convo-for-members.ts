import { type ChatBskyConvoGetConvoForMembers } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type Did } from '@atcute/lexicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { precacheConvoQuery } from './conversation';

export function useGetConvoForMembers({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: ChatBskyConvoGetConvoForMembers.$output) => void;
	onError?: (error: Error) => void;
}) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async (members: string[]) => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.get('chat.bsky.convo.getConvoForMembers', {
					params: { members: members as Did[] },
				}),
			);

			return data;
		},
		onSuccess: (data) => {
			precacheConvoQuery(queryClient, data.convo);
			onSuccess?.(data);
		},
		onError: (error) => {
			logger.error(error);
			onError?.(error);
		},
	});
}
