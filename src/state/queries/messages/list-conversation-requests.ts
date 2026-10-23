import { ok } from '@atcute/client';

import { type QueryClient, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { CONVO_REQUEST_LIST_RQKEY_ROOT } from '#/state/queries/messages/keys';
import type { ConvoRequestListQueryData } from '#/state/queries/messages/list-conversation-requests-cache';
import { getClients } from '#/state/session';

const DEFAULT_LIMIT = 10;

const RQKEY = (limit: number = DEFAULT_LIMIT) => [CONVO_REQUEST_LIST_RQKEY_ROOT, limit];

export function useListConvoRequests({
	enabled = true,
	limit = DEFAULT_LIMIT,
}: { enabled?: boolean; limit?: number } = {}) {
	const { chat } = getClients();

	return useInfiniteQuery({
		queryKey: RQKEY(limit),
		enabled,
		queryFn: async ({ pageParam, signal }) => {
			if (!chat) {
				throw new Error('Not signed in');
			}
			const data = await ok(
				chat.get('chat.bsky.convo.listConvoRequests', {
					signal,
					params: { limit, cursor: pageParam },
				}),
			);
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

/**
 * yields every cached profile in the request-list (members of incoming conversation requests and the owner of
 * each outgoing group join-request) so profile-shadow updates reach the inbox rows.
 */
function* findAllProfilesInQueryData(queryClient: QueryClient, did: string) {
	const queryDatas = queryClient.getQueriesData<ConvoRequestListQueryData>({
		queryKey: [CONVO_REQUEST_LIST_RQKEY_ROOT],
	});
	for (const [, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const item of page.requests) {
				if (item.$type === 'chat.bsky.convo.defs#convoView') {
					for (const member of item.members) {
						if (member.did === did) {
							yield member;
						}
					}
				} else if (item.$type === 'chat.bsky.group.defs#joinRequestConvoView') {
					if (item.owner.did === did) {
						yield item.owner;
					}
				}
			}
		}
	}
}

registerShadowFinders(CONVO_REQUEST_LIST_RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
