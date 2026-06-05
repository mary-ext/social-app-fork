import { useEffect } from 'react';
import { ok } from '@atcute/client';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { useMessagesEventBus } from '#/state/messages/events';
import { createQueryKey } from '#/state/queries/util';
import { useClients } from '#/state/session';

import { STALE } from '..';

export const JOIN_REQUESTS_THRESHOLD = 20;

const listJoinRequestsQueryKeyRoot = 'list-join-requests';

export const createListJoinRequestsQueryKey = (args: { convoId: string }) =>
	createQueryKey(listJoinRequestsQueryKeyRoot, args);

export function useListJoinRequestsQuery({
	convoId,
	enabled,
}: {
	convoId: string | undefined;
	enabled?: boolean;
}) {
	const { chat } = useClients();
	const queryClient = useQueryClient();
	const messagesBus = useMessagesEventBus();
	const isEnabled = enabled !== false && !!convoId;

	useEffect(() => {
		if (!isEnabled || !convoId) return;

		return messagesBus.on(
			(event) => {
				if (event.type !== 'logs') return;
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
		enabled: isEnabled,
		queryKey: createListJoinRequestsQueryKey({ convoId: convoId ?? '' }),
		queryFn: async ({ pageParam }) => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.get('chat.bsky.group.listJoinRequests', {
					params: { convoId: convoId!, cursor: pageParam, limit: JOIN_REQUESTS_THRESHOLD },
				}),
			);
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (page) => page.cursor,
		staleTime: STALE.MINUTES.ONE,
	});
}
