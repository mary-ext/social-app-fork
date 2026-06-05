import type { ChatBskyConvoDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { RQKEY as CONVO_KEY } from './conversation';
import { type ConvoListQueryData, RQKEY_ROOT as CONVO_LIST_ROOT_KEY } from './list-conversations';

export function useMarkJoinRequestsRead(convoId: string | undefined) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async () => {
			if (!convoId) throw new Error('No convoId provided');
			if (!chat) throw new Error('Not signed in');
			await ok(chat.post('chat.bsky.group.updateJoinRequestsRead', { input: { convoId } }));
		},
		onMutate: () => {
			if (!convoId) return;

			const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(CONVO_KEY(convoId));
			queryClient.setQueryData<ChatBskyConvoDefs.ConvoView | undefined>(CONVO_KEY(convoId), (old) => {
				if (!old || old.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') return old;
				return {
					...old,
					kind: { ...old.kind, unreadJoinRequestCount: 0 },
				};
			});

			const prevListEntries = queryClient.getQueriesData<ConvoListQueryData>({
				queryKey: [CONVO_LIST_ROOT_KEY],
			});
			queryClient.setQueriesData<ConvoListQueryData>({ queryKey: [CONVO_LIST_ROOT_KEY] }, (old) => {
				if (!old) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						convos: page.convos.map((convo) => {
							if (convo.id !== convoId || convo.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') {
								return convo;
							}
							return {
								...convo,
								kind: { ...convo.kind, unreadJoinRequestCount: 0 },
							};
						}),
					})),
				};
			});

			return { prevConvo, prevListEntries };
		},
		onError: (error, _, context) => {
			logger.error('Failed to mark join requests as read', { safeMessage: error });
			if (!convoId) return;
			if (context?.prevConvo) {
				queryClient.setQueryData(CONVO_KEY(convoId), context.prevConvo);
			}
			for (const [key, data] of context?.prevListEntries ?? []) {
				queryClient.setQueryData(key, data);
			}
			void queryClient.invalidateQueries({ queryKey: CONVO_KEY(convoId) });
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_ROOT_KEY] });
		},
	});
}
