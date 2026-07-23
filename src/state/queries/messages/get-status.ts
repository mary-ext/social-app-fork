import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { createQueryKey } from '#/state/queries/util';
import { getClients } from '#/state/session';

const chatActorStatusQueryKey = () => createQueryKey('chat-actor-status', {}, { persistedVersion: 1 });

export function useChatActorStatusQuery() {
	const { chat } = getClients();

	return useQuery({
		gcTime: STALE.INFINITY,
		staleTime: STALE.SECONDS.FIFTEEN,
		queryKey: chatActorStatusQueryKey(),
		queryFn: async () => {
			if (!chat) {
				throw new Error('Not signed in');
			}
			return await ok(chat.get('chat.bsky.actor.getStatus', {}));
		},
	});
}
