import { useEffect } from 'react';

import { ok } from '@atcute/client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { useMessagesEventBus } from '#/state/messages/events';
import { createListJoinRequestsQueryKey } from '#/state/queries/messages/keys';
import { getClients } from '#/state/session';

export const JOIN_REQUESTS_THRESHOLD = 20;

export function useListJoinRequestsQuery({
	convoId,
	enabled,
}: {
	convoId: string | undefined;
	enabled?: boolean;
}) {
	const { chat } = getClients();
	const queryClient = useQueryClient();
	const messagesBus = useMessagesEventBus();
	const isEnabled = enabled !== false && !!convoId;

	useEffect(() => {
		if (!isEnabled || !convoId) {
			return;
		}

		return messagesBus.on(
			(event) => {
				if (event.type !== 'logs') {
					return;
				}
				for (const log of event.logs) {
					if (
						log.$type === 'chat.bsky.convo.defs#logIncomingJoinRequest' ||
						log.$type === 'chat.bsky.convo.defs#logApproveJoinRequest' ||
						log.$type === 'chat.bsky.convo.defs#logRejectJoinRequest'
					) {
						void queryClient.invalidateQueries({
							queryKey: createListJoinRequestsQueryKey({ convoId }),
						});
						return;
					}
				}
			},
			{ convoId },
		);
	}, [isEnabled, convoId, messagesBus, queryClient]);

	return useInfiniteQuery({
		queryKey: createListJoinRequestsQueryKey({ convoId: convoId ?? '' }),
		enabled: isEnabled,
		staleTime: STALE.MINUTES.ONE,
		queryFn: async ({ pageParam, signal }) => {
			if (!chat) {
				throw new Error('Not signed in');
			}
			const data = await ok(
				chat.get('chat.bsky.group.listJoinRequests', {
					signal,
					params: { convoId: convoId!, cursor: pageParam, limit: JOIN_REQUESTS_THRESHOLD },
				}),
			);
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (page) => page.cursor,
	});
}
