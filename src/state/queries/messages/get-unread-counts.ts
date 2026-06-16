import { ok } from '@atcute/client';
import { useQuery } from '@tanstack/react-query';

import { useClients, useSession } from '#/state/session';

import { STALE } from '..';

const RQKEY_ROOT = 'convo-unread-counts';
export const RQKEY = (includeGroupChats: boolean) => [RQKEY_ROOT, includeGroupChats] as const;
export const RQKEY_PARTIAL = [RQKEY_ROOT] as const;

export function useUnreadCountsQuery() {
	const { hasSession } = useSession();
	const { chat } = useClients();
	// no age assurance in this fork, so group chats are always counted
	const includeGroupChats = true;

	return useQuery({
		queryKey: RQKEY(includeGroupChats),
		queryFn: async () => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.get('chat.bsky.convo.getUnreadCounts', {
					params: { includeGroupChats },
				}),
			);
			return data;
		},
		staleTime: STALE.SECONDS.FIFTEEN,
		enabled: hasSession,
	});
}
