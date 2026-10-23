import type { ChatBskyConvoLeaveConvo } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateJoinLinkPreviewsForConvo } from '#/state/queries/messages/join-links-cache';
import {
	CONVO_REQUEST_LIST_RQKEY_ROOT as CONVO_REQUEST_LIST_KEY,
	LIST_CONVOS_RQKEY_ROOT as CONVO_LIST_KEY,
} from '#/state/queries/messages/keys';
import {
	type ConvoRequestListQueryData,
	optimisticDelete as optimisticDeleteRequest,
} from '#/state/queries/messages/list-conversation-requests-cache';
import type { ConvoListQueryData } from '#/state/queries/messages/list-conversations-cache';
import { getClients } from '#/state/session';

const RQKEY_ROOT = 'leave-convo';
function RQKEY(convoId: string | undefined) {
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
	const { chat } = getClients();

	return useMutation({
		mutationKey: RQKEY(convoId),
		mutationFn: async () => {
			if (!convoId) {
				throw new Error('No convoId provided');
			}
			if (!chat) {
				throw new Error('Not signed in');
			}

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
				if (!old) {
					return old;
				}
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						convos: page.convos.filter((convo) => convo.id !== convoId),
					})),
				};
			});
			// leaving also covers rejecting/deleting an incoming request, so drop it from the
			// separate request-inbox cache too
			const prevRequestsQueries = queryClient.getQueriesData<ConvoRequestListQueryData>({
				queryKey: [CONVO_REQUEST_LIST_KEY],
			});
			if (convoId) {
				queryClient.setQueriesData<ConvoRequestListQueryData>({ queryKey: [CONVO_REQUEST_LIST_KEY] }, (old) =>
					optimisticDeleteRequest(convoId, old),
				);
			}
			onMutate?.();
			return { prevConvoListQueries, prevRequestsQueries };
		},
		onSuccess: (data) => {
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_KEY] });
			void queryClient.invalidateQueries({ queryKey: [CONVO_REQUEST_LIST_KEY] });
			if (convoId) {
				void invalidateJoinLinkPreviewsForConvo(queryClient, convoId);
			}
			onSuccess?.(data);
		},
		onError: (error, _, context) => {
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
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_KEY] });
			void queryClient.invalidateQueries({ queryKey: [CONVO_REQUEST_LIST_KEY] });
			onError?.(error);
		},
	});
}
