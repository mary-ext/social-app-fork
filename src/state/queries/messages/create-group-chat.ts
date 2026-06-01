import type { ChatBskyGroupCreateGroup } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { precacheConvoQuery } from './conversation';

export function useCreateGroupChat({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: ChatBskyGroupCreateGroup.$output) => void;
	onError?: (error: Error) => void;
}) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async ({ name, members }: { name: string; members: string[] }) => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.post('chat.bsky.group.createGroup', {
					input: { name, members: members as ChatBskyGroupCreateGroup.$input['members'] },
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
