import type { ChatBskyConvoAcceptConvo } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import {
	type ConvoRequestListQueryData,
	optimisticDelete as optimisticDeleteRequest,
	RQKEY_ROOT as CONVO_REQUEST_LIST_KEY,
} from './list-conversation-requests';
import {
	type ConvoListItem,
	type ConvoListQueryData,
	convoListQueryPredicate,
	getConvoFromQueryData,
	optimisticDelete,
	RQKEY_PARTIAL as CONVO_LIST_PARTIAL_KEY,
	RQKEY_ROOT as CONVO_LIST_ROOT_KEY,
} from './list-conversations';

export function useAcceptConversation(
	convoId: string,
	{
		onSuccess,
		onMutate,
		onError,
	}: {
		onMutate?: () => void;
		onSuccess?: (data: ChatBskyConvoAcceptConvo.$output) => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async () => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(chat.post('chat.bsky.convo.acceptConvo', { input: { convoId } }));

			return data;
		},
		onMutate: () => {
			// snapshot every convo-list cache up front so onError can restore them
			// all by their exact keys
			const prevConvoListQueries = queryClient.getQueriesData<ConvoListQueryData>({
				queryKey: [CONVO_LIST_ROOT_KEY],
			});
			// the request inbox is a separate cache; drop the accepted request from it too
			const prevRequestsQueries = queryClient.getQueriesData<ConvoRequestListQueryData>({
				queryKey: [CONVO_REQUEST_LIST_KEY],
			});
			queryClient.setQueriesData<ConvoRequestListQueryData>({ queryKey: [CONVO_REQUEST_LIST_KEY] }, (old) =>
				optimisticDeleteRequest(convoId, old),
			);
			let convoBeingAccepted: ConvoListItem | null = null;
			for (const [, data] of queryClient.getQueriesData<ConvoListQueryData>({
				queryKey: CONVO_LIST_PARTIAL_KEY('request'),
			})) {
				if (!data) continue;
				convoBeingAccepted = getConvoFromQueryData(convoId, data);
				if (convoBeingAccepted) break;
			}
			queryClient.setQueriesData(
				{ queryKey: CONVO_LIST_PARTIAL_KEY('request') },
				(old?: ConvoListQueryData) => optimisticDelete(convoId, old),
			);
			if (convoBeingAccepted) {
				const acceptedConvo: ConvoListItem = {
					...convoBeingAccepted,
					status: 'accepted',
				};
				queryClient.setQueriesData(
					{
						queryKey: CONVO_LIST_PARTIAL_KEY('accepted'),
						predicate: convoListQueryPredicate(acceptedConvo),
					},
					(old?: ConvoListQueryData) => {
						if (!old) return old;
						return {
							...old,
							pages: old.pages.map((page, i) => {
								const convos = page.convos.filter((c) => c.id !== convoId);
								if (i === 0) {
									return { ...page, convos: [acceptedConvo, ...convos] };
								}
								return { ...page, convos };
							}),
						};
					},
				);
			}
			onMutate?.();
			return { prevConvoListQueries, prevRequestsQueries };
		},
		onSuccess: (data) => {
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_ROOT_KEY] });
			void queryClient.invalidateQueries({ queryKey: [CONVO_REQUEST_LIST_KEY] });
			onSuccess?.(data);
		},
		onError: (error, _, context) => {
			logger.error(error);
			if (context?.prevConvoListQueries) {
				for (const [queryKey, prevData] of context.prevConvoListQueries) {
					queryClient.setQueryData(queryKey, prevData);
				}
			}
			if (context?.prevRequestsQueries) {
				for (const [queryKey, prevData] of context.prevRequestsQueries) {
					queryClient.setQueryData(queryKey, prevData);
				}
			}
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_ROOT_KEY] });
			void queryClient.invalidateQueries({ queryKey: [CONVO_REQUEST_LIST_KEY] });
			onError?.(error);
		},
	});
}
