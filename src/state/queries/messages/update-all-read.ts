import type { ChatBskyConvoGetUnreadCounts } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { RQKEY_PARTIAL as UNREAD_COUNTS_PARTIAL_KEY } from './get-unread-counts';
import {
	type ConvoRequestListQueryData,
	markAllRead as markAllRequestsRead,
	RQKEY_ROOT as CONVO_REQUEST_LIST_KEY,
} from './list-conversation-requests';
import {
	type ConvoListQueryData,
	RQKEY_PARTIAL as CONVO_LIST_PARTIAL_KEY,
	RQKEY_ROOT as CONVO_LIST_ROOT_KEY,
} from './list-conversations';

export function useUpdateAllRead(
	status: 'accepted' | 'request',
	{
		onSuccess,
		onMutate,
		onError,
	}: {
		onMutate?: () => void;
		onSuccess?: () => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async () => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.post('chat.bsky.convo.updateAllRead', {
					input: { status },
				}),
			);

			return data;
		},
		onMutate: () => {
			// snapshot every convo-list cache up front so onError can restore them
			// all by their exact keys
			const prevConvoListQueries = queryClient.getQueriesData<ConvoListQueryData>({
				queryKey: [CONVO_LIST_ROOT_KEY],
			});
			// the request inbox is a separate cache; clear its unread rows too
			const prevRequestsQueries = queryClient.getQueriesData<ConvoRequestListQueryData>({
				queryKey: [CONVO_REQUEST_LIST_KEY],
			});
			if (status === 'request') {
				queryClient.setQueriesData<ConvoRequestListQueryData>({ queryKey: [CONVO_REQUEST_LIST_KEY] }, (old) =>
					markAllRequestsRead(old),
				);
			}
			queryClient.setQueriesData({ queryKey: CONVO_LIST_PARTIAL_KEY(status) }, (old?: ConvoListQueryData) => {
				if (!old) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						convos: page.convos.map((convo) => ({
							...convo,
							unreadCount: 0,
						})),
					})),
				};
			});
			// remove unread convos from the badge queries
			queryClient.setQueriesData(
				{ queryKey: CONVO_LIST_PARTIAL_KEY('all', 'unread') },
				(old?: ConvoListQueryData) => {
					if (!old) return old;
					return {
						...old,
						pages: old.pages.map((page) => ({
							...page,
							convos: page.convos.filter((convo) => convo.status !== status),
						})),
					};
				},
			);
			// zero out the badge count query that actually drives the unread badge,
			// since it's a separate server query that the list caches don't feed
			const prevUnreadCountsQueries = queryClient.getQueriesData<ChatBskyConvoGetUnreadCounts.$output>({
				queryKey: UNREAD_COUNTS_PARTIAL_KEY,
			});
			queryClient.setQueriesData<ChatBskyConvoGetUnreadCounts.$output>(
				{ queryKey: UNREAD_COUNTS_PARTIAL_KEY },
				(old) => {
					if (!old) return old;
					return {
						...old,
						...(status === 'accepted' ? { unreadAcceptedConvos: 0 } : { unreadRequestConvos: 0 }),
					};
				},
			);
			onMutate?.();
			return { prevConvoListQueries, prevRequestsQueries, prevUnreadCountsQueries };
		},
		onSuccess: () => {
			// the optimistic badge zeroing can drift from the server, so invalidate
			// the count query to let it self-correct on next access rather than
			// waiting for a log event
			void queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_PARTIAL_KEY });
			void queryClient.invalidateQueries({ queryKey: CONVO_LIST_PARTIAL_KEY(status) });
			void queryClient.invalidateQueries({ queryKey: CONVO_LIST_PARTIAL_KEY('all', 'unread') });
			if (status === 'request') {
				void queryClient.invalidateQueries({ queryKey: [CONVO_REQUEST_LIST_KEY] });
			}
			onSuccess?.();
		},
		onError: (error, _, context) => {
			logger.error(error);
			if (context?.prevConvoListQueries) {
				for (const [queryKey, prevData] of context.prevConvoListQueries) {
					queryClient.setQueryData(queryKey, prevData);
				}
			}
			if (status === 'request' && context?.prevRequestsQueries) {
				for (const [queryKey, prevData] of context.prevRequestsQueries) {
					queryClient.setQueryData(queryKey, prevData);
				}
				void queryClient.invalidateQueries({ queryKey: [CONVO_REQUEST_LIST_KEY] });
			}
			if (context?.prevUnreadCountsQueries) {
				for (const [queryKey, prevData] of context.prevUnreadCountsQueries) {
					queryClient.setQueryData(queryKey, prevData);
				}
			}
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_ROOT_KEY] });
			onError?.(error);
		},
	});
}
