import type { ChatBskyActorDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type QueryClient, useQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { registerShadowFinders } from '#/state/cache/registry';
import { LIST_CONVO_MEMBERS_RQKEY_ROOT, listConvoMembersQueryKey } from '#/state/queries/messages/keys';
import { getClients } from '#/state/session';

// group chat size is at least 50, so should fetch the whole list in one go
const LIMIT = 50;

export function useListConvoMembersQuery({
	convoId,
	placeholderData,
}: {
	convoId: string;
	placeholderData?: ChatBskyActorDefs.ProfileViewBasic[];
}) {
	const { chat } = getClients();

	return useQuery({
		queryKey: listConvoMembersQueryKey(convoId),
		staleTime: STALE.MINUTES.THIRTY,
		queryFn: async ({ signal }) => {
			if (!chat) {
				throw new Error('Not signed in');
			}
			const members: ChatBskyActorDefs.ProfileViewBasic[] = [];
			let cursor: string | undefined;

			do {
				const data = await ok(
					chat.get('chat.bsky.convo.getConvoMembers', {
						signal,
						params: { convoId, cursor, limit: LIMIT },
					}),
				);
				members.push(...data.members);
				cursor = data.cursor;
			} while (cursor);

			return members;
		},
		placeholderData,
	});
}

function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<ChatBskyActorDefs.ProfileViewBasic, void> {
	const queryDatas = queryClient.getQueriesData<ChatBskyActorDefs.ProfileViewBasic[]>({
		queryKey: [LIST_CONVO_MEMBERS_RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData) {
			continue;
		}
		for (const member of queryData) {
			if (member.did === did) {
				yield member;
			}
		}
	}
}

registerShadowFinders(LIST_CONVO_MEMBERS_RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
