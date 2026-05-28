import type { ChatBskyActorDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type QueryClient, useQuery } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { createQueryKey } from '#/state/queries/util';
import { useClients } from '#/state/session';

const RQKEY_ROOT = 'listConvoMembers';
export const listConvoMembersQueryKey = (convoId: string) => createQueryKey(RQKEY_ROOT, { convoId });

// group chat size is at least 50, so should fetch the whole list in one go
const LIMIT = 50;

export function useListConvoMembersQuery({
	convoId,
	placeholderData,
}: {
	convoId: string;
	placeholderData?: ChatBskyActorDefs.ProfileViewBasic[];
}) {
	const { chat } = useClients();

	return useQuery({
		queryKey: listConvoMembersQueryKey(convoId),
		queryFn: async () => {
			if (!chat) throw new Error('Not signed in');
			const members: ChatBskyActorDefs.ProfileViewBasic[] = [];
			let cursor: string | undefined;

			do {
				const data = await ok(
					chat.get('chat.bsky.convo.getConvoMembers', {
						params: { convoId, cursor, limit: LIMIT },
					}),
				);
				members.push(...data.members);
				cursor = data.cursor;
			} while (cursor);

			return members;
		},
		staleTime: STALE.MINUTES.THIRTY,
		placeholderData,
	});
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<ChatBskyActorDefs.ProfileViewBasic, void> {
	const queryDatas = queryClient.getQueriesData<ChatBskyActorDefs.ProfileViewBasic[]>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData) continue;
		for (const member of queryData) {
			if (member.did === did) {
				yield member;
			}
		}
	}
}
