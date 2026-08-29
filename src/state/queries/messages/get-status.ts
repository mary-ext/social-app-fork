import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { GCTIME, STALE } from '#/state/queries';
import { createQueryPersister } from '#/state/query-persister';
import { getClients } from '#/state/session';

const chatActorStatusQueryKey = () => ['chat-actor-status'];
const chatActorStatusQueryPersister = createQueryPersister({ version: 1 });

export function useChatActorStatusQuery() {
	const { chat } = getClients();

	return useQuery({
		queryKey: chatActorStatusQueryKey(),
		staleTime: STALE.SECONDS.FIFTEEN,
		gcTime: GCTIME.DAYS.SEVEN,
		queryFn: async ({ signal }) => {
			if (!chat) {
				throw new Error('Not signed in');
			}
			return await ok(chat.get('chat.bsky.actor.getStatus', { signal }));
		},
		persister: chatActorStatusQueryPersister,
	});
}
