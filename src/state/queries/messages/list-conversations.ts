import type { ChatBskyConvoListConvos } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type InfiniteData, type QueryClient, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { LIST_CONVOS_RQKEY_ROOT, listConvosQueryKey } from '#/state/queries/messages/keys';
import { getClients } from '#/state/session';

const DEFAULT_LIMIT = 10;

type RQPageParam = string | undefined;

export function useListConvosQuery({
	enabled,
	status,
	readState = 'all',
	kind = 'all',
	limit = DEFAULT_LIMIT,
	lockStatus,
}: {
	enabled?: boolean;
	status?: 'request' | 'accepted';
	readState?: 'all' | 'unread';
	kind?: 'all' | 'group' | 'direct';
	limit?: number;
	lockStatus?: 'unlocked' | 'locked' | 'locked-permanently';
} = {}) {
	const { chat } = getClients();

	return useInfiniteQuery({
		queryKey: listConvosQueryKey(status ?? 'all', readState, kind, lockStatus, limit),
		enabled,
		queryFn: async ({ pageParam, signal }) => {
			if (!chat) {
				throw new Error('Not signed in');
			}
			const data = await ok(
				chat.get('chat.bsky.convo.listConvos', {
					signal,
					params: {
						limit,
						cursor: pageParam,
						readState: readState === 'unread' ? 'unread' : undefined,
						kind: kind === 'all' ? undefined : kind,
						lockStatus,
						status,
					},
				}),
			);
			return data;
		},
		initialPageParam: undefined as RQPageParam,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

function* findAllProfilesInQueryData(queryClient: QueryClient, did: string) {
	const queryDatas = queryClient.getQueriesData<InfiniteData<ChatBskyConvoListConvos.$output>>({
		queryKey: [LIST_CONVOS_RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}

		for (const page of queryData.pages) {
			for (const convo of page.convos) {
				for (const member of convo.members) {
					if (member.did === did) {
						yield member;
					}
				}
			}
		}
	}
}

registerShadowFinders(LIST_CONVOS_RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
