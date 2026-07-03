import type { ChatBskyConvoMuteConvo } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { rollbackConvoOptimistic, updateConvoOptimistic } from './utils/convo-cache';

export function useMuteConvo(
	convoId: string | undefined,
	{
		onSuccess,
		onError,
	}: {
		onSuccess?: (data: ChatBskyConvoMuteConvo.$output) => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async ({ mute }: { mute: boolean }) => {
			if (!convoId) throw new Error('No convoId provided');
			if (!chat) throw new Error('Not signed in');
			if (mute) {
				const data = await ok(
					chat.post('chat.bsky.convo.muteConvo', {
						input: { convoId },
					}),
				);
				return data;
			} else {
				const data = await ok(
					chat.post('chat.bsky.convo.unmuteConvo', {
						input: { convoId },
					}),
				);
				return data;
			}
		},
		onMutate: ({ mute }) => {
			if (!convoId) return;
			return updateConvoOptimistic(queryClient, convoId, (prev) => ({
				...prev,
				muted: mute,
			}));
		},
		onSuccess: (data) => {
			onSuccess?.(data);
		},
		onError: (e, _variables, context) => {
			if (convoId && context) {
				rollbackConvoOptimistic(queryClient, convoId, context);
			}
			onError?.(e);
		},
	});
}
