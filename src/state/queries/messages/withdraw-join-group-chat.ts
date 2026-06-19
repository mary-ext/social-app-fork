import type { ChatBskyGroupWithdrawJoinRequest } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import {
	type ConvoRequestListQueryData,
	optimisticDeleteJoinRequest,
	RQKEY_ROOT as CONVO_REQUEST_LIST_KEY,
} from './list-conversation-requests';

export function useWithdrawJoinGroupChatRequest({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: ChatBskyGroupWithdrawJoinRequest.$output) => void;
	onError?: (error: Error) => void;
} = {}) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async ({ convoId }: { convoId: string }) => {
			if (!chat) throw new Error('Must be logged in to withdraw a join request');
			if (!convoId) throw new Error('No convoId provided');
			return await ok(chat.post('chat.bsky.group.withdrawJoinRequest', { input: { convoId } }));
		},
		onMutate: ({ convoId }) => {
			const prev = queryClient.getQueriesData<ConvoRequestListQueryData>({
				queryKey: [CONVO_REQUEST_LIST_KEY],
			});
			queryClient.setQueriesData<ConvoRequestListQueryData>({ queryKey: [CONVO_REQUEST_LIST_KEY] }, (old) =>
				optimisticDeleteJoinRequest(convoId, old),
			);
			return { prev };
		},
		onSuccess: (data) => {
			void queryClient.invalidateQueries({ queryKey: [CONVO_REQUEST_LIST_KEY] });
			onSuccess?.(data);
		},
		onError: (error, _variables, context) => {
			logger.error('Failed to withdraw join request', { safeMessage: error });
			if (context?.prev) {
				for (const [key, data] of context.prev) {
					queryClient.setQueryData(key, data);
				}
			}
			onError?.(error);
		},
	});
}
