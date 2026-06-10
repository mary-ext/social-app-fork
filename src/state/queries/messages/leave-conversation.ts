import type { ChatBskyConvoLeaveConvo } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateJoinLinkPreviewsForConvo } from '#/state/queries/join-links';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { type ConvoListQueryData, RQKEY_ROOT as CONVO_LIST_KEY } from './list-conversations';

const RQKEY_ROOT = 'leave-convo';
export function RQKEY(convoId: string | undefined) {
	return [RQKEY_ROOT, convoId];
}

export function useLeaveConvo(
	convoId: string | undefined,
	{
		onSuccess,
		onMutate,
		onError,
	}: {
		onMutate?: () => void;
		onSuccess?: (data: ChatBskyConvoLeaveConvo.$output) => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationKey: RQKEY(convoId),
		mutationFn: async () => {
			if (!convoId) throw new Error('No convoId provided');
			if (!chat) throw new Error('Not signed in');

			const data = await ok(
				chat.post('chat.bsky.convo.leaveConvo', {
					input: { convoId },
				}),
			);

			return data;
		},
		onMutate: () => {
			const prevConvoListQueries = queryClient.getQueriesData<ConvoListQueryData>({
				queryKey: [CONVO_LIST_KEY],
			});
			queryClient.setQueriesData<ConvoListQueryData>({ queryKey: [CONVO_LIST_KEY] }, (old) => {
				if (!old) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						convos: page.convos.filter((convo) => convo.id !== convoId),
					})),
				};
			});
			onMutate?.();
			return { prevConvoListQueries };
		},
		onSuccess: (data) => {
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_KEY] });
			if (convoId) {
				void invalidateJoinLinkPreviewsForConvo(queryClient, convoId);
			}
			onSuccess?.(data);
		},
		onError: (error, _, context) => {
			logger.error(error);
			if (context?.prevConvoListQueries) {
				for (const [queryKey, prevData] of context.prevConvoListQueries) {
					queryClient.setQueryData(queryKey, prevData);
				}
			}
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_KEY] });
			onError?.(error);
		},
	});
}
