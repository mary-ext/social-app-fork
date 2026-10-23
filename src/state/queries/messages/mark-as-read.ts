import type { ChatBskyConvoDefs, ChatBskyConvoGetUnreadCounts } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { UNREAD_ACCEPTED_CAP, UNREAD_REQUEST_CAP } from '#/state/queries/messages/get-unread-counts';
import {
	LIST_CONVOS_RQKEY_ROOT,
	UNREAD_COUNTS_RQKEY_PARTIAL as UNREAD_COUNTS_PARTIAL_KEY,
} from '#/state/queries/messages/keys';
import {
	type ConvoListQueryData,
	getConvoFromQueryData,
	optimisticUpdate as optimisticUpdateConvo,
} from '#/state/queries/messages/list-conversations-cache';
import { getClients } from '#/state/session';

export function useMarkAsReadMutation() {
	const optimisticUpdate = useOnMarkAsRead();
	const queryClient = useQueryClient();
	const { chat } = getClients();

	return useMutation({
		mutationFn: async ({ convoId }: { convoId: string }) => {
			if (!chat) {
				throw new Error('Not signed in');
			}

			await ok(
				chat.post('chat.bsky.convo.updateRead', {
					input: { convoId },
				}),
			);
		},
		onMutate({ convoId }) {
			// snapshot the list caches before the optimistic update so onError can
			// restore the convo rows alongside the badge count
			const prevListQueries = queryClient.getQueriesData<ConvoListQueryData>({
				queryKey: [LIST_CONVOS_RQKEY_ROOT],
			});

			// find the convo so we know which badge counter (if any) to decrement.
			// keep scanning past a stale unreadCount === 0 cache so another cache
			// holding the true unread state still drives the decrement
			let unreadStatus: ChatBskyConvoDefs.ConvoView['status'] | undefined;
			// distinct from `unreadStatus`: a convo in no list cache at all is unknown, not known-read
			let knownRead = false;
			for (const [, data] of prevListQueries) {
				if (!data) {
					continue;
				}
				const convo = getConvoFromQueryData(convoId, data);
				if (convo?.unreadCount) {
					unreadStatus = convo.status;
					break;
				}
				if (convo) {
					knownRead = true;
				}
			}

			// the only place the list rows are zeroed; repeating it once the round trip returns would
			// discard a message that landed in between, which the server counts as unread
			optimisticUpdate(convoId);

			// the badge count query is a separate server query that the list caches
			// don't feed, so decrement it here to keep the badge in sync
			const prevUnreadCountsQueries = queryClient.getQueriesData<ChatBskyConvoGetUnreadCounts.$output>({
				queryKey: UNREAD_COUNTS_PARTIAL_KEY,
			});
			if (unreadStatus) {
				queryClient.setQueriesData<ChatBskyConvoGetUnreadCounts.$output>(
					{ queryKey: UNREAD_COUNTS_PARTIAL_KEY },
					(old) => {
						if (!old) {
							return old;
						}
						return {
							...old,
							...(unreadStatus === 'request'
								? {
										unreadRequestConvos:
											old.unreadRequestConvos >= UNREAD_REQUEST_CAP
												? old.unreadRequestConvos
												: Math.max(0, old.unreadRequestConvos - 1),
									}
								: {
										unreadAcceptedConvos:
											old.unreadAcceptedConvos >= UNREAD_ACCEPTED_CAP
												? old.unreadAcceptedConvos
												: Math.max(0, old.unreadAcceptedConvos - 1),
									}),
						};
					},
				);
			}
			return { knownRead: knownRead && !unreadStatus, prevListQueries, prevUnreadCountsQueries };
		},
		onSuccess(_, __, context) {
			// the optimistic badge arithmetic can drift from the server (e.g. a convo
			// whose status differs between caches, or a sentinel-capped count).
			// invalidate so the 15s-stale count query self-corrects on next access
			// rather than waiting for a log event. skipped when the caches said the convo
			// was already read, since this fires on entering *and* leaving every one of them
			if (!context?.knownRead) {
				void queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_PARTIAL_KEY });
			}
		},
		onError(_, __, context) {
			if (context?.prevListQueries) {
				for (const [queryKey, prevData] of context.prevListQueries) {
					queryClient.setQueryData(queryKey, prevData);
				}
			}
			if (context?.prevUnreadCountsQueries) {
				for (const [queryKey, prevData] of context.prevUnreadCountsQueries) {
					queryClient.setQueryData(queryKey, prevData);
				}
			}
		},
	});
}

function useOnMarkAsRead() {
	const queryClient = useQueryClient();

	return (chatId: string) => {
		queryClient.setQueriesData({ queryKey: [LIST_CONVOS_RQKEY_ROOT] }, (old?: ConvoListQueryData) => {
			if (!old) {
				return old;
			}
			return optimisticUpdateConvo(chatId, old, (convo) => ({
				...convo,
				unreadCount: 0,
			}));
		});
	};
}
