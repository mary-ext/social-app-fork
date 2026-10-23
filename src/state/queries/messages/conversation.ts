import type { ChatBskyActorDefs, ChatBskyConvoGetConvo } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type QueryClient, useQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { registerShadowFinders } from '#/state/cache/registry';
import { CONVO_RQKEY_ROOT, convoQueryKey } from '#/state/queries/messages/keys';
import { getClients } from '#/state/session';

export function useConvoQuery({ convoId }: { convoId: string }) {
	const { chat } = getClients();

	return useQuery({
		queryKey: convoQueryKey(convoId),
		staleTime: STALE.INFINITY,
		queryFn: async ({ signal }) => {
			if (!chat) {
				throw new Error('Not signed in');
			}
			const data = await ok(chat.get('chat.bsky.convo.getConvo', { signal, params: { convoId } }));
			return data.convo;
		},
	});
}

function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<ChatBskyActorDefs.ProfileViewBasic, void> {
	const queryDatas = queryClient.getQueriesData<ChatBskyConvoGetConvo.$output['convo']>({
		queryKey: [CONVO_RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData) {
			continue;
		}
		for (const member of queryData.members) {
			if (member.did === did) {
				yield member;
			}
		}
	}
}

registerShadowFinders(CONVO_RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
