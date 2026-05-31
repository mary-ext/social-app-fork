import { type ChatBskyActorDefs, type ChatBskyConvoDefs, type ChatBskyConvoGetConvo } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { useOnMarkAsRead } from '#/state/queries/messages/list-conversations';
import { useClients } from '#/state/session';

import {
	type ConvoListQueryData,
	getConvoFromQueryData,
	RQKEY_ROOT as LIST_CONVOS_KEY,
} from './list-conversations';

export const RQKEY_ROOT = 'convo';
export const RQKEY = (convoId: string) => [RQKEY_ROOT, convoId];

export function useConvoQuery({ convoId }: { convoId: string }) {
	const { chat } = useClients();

	return useQuery({
		queryKey: RQKEY(convoId),
		queryFn: async () => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(chat.get('chat.bsky.convo.getConvo', { params: { convoId } }));
			return data.convo;
		},
		staleTime: STALE.INFINITY,
	});
}

export function precacheConvoQuery(queryClient: QueryClient, convo: ChatBskyConvoDefs.ConvoView) {
	queryClient.setQueryData(RQKEY(convo.id), convo);
}

export function useMarkAsReadMutation() {
	const optimisticUpdate = useOnMarkAsRead();
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async ({ convoId, messageId }: { convoId?: string; messageId?: string }) => {
			if (!convoId) throw new Error('No convoId provided');
			if (!chat) throw new Error('Not signed in');

			await ok(
				chat.post('chat.bsky.convo.updateRead', {
					input: { convoId, messageId },
				}),
			);
		},
		onMutate({ convoId }) {
			if (!convoId) throw new Error('No convoId provided');
			optimisticUpdate(convoId);
		},
		onSuccess(_, { convoId }) {
			if (!convoId) return;

			queryClient.setQueriesData({ queryKey: [LIST_CONVOS_KEY] }, (old?: ConvoListQueryData) => {
				if (!old) return old;

				const existingConvo = getConvoFromQueryData(convoId, old);

				if (existingConvo) {
					return {
						...old,
						pages: old.pages.map((page) => {
							return {
								...page,
								convos: page.convos.map((convo) => {
									if (convo.id === convoId) {
										return {
											...convo,
											unreadCount: 0,
										};
									}
									return convo;
								}),
							};
						}),
					};
				} else {
					// If we somehow marked a convo as read that doesn't exist in the
					// list, then we don't need to do anything.
				}
			});
		},
	});
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<ChatBskyActorDefs.ProfileViewBasic, void> {
	const queryDatas = queryClient.getQueriesData<ChatBskyConvoGetConvo.$output['convo']>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData) continue;
		for (const member of queryData.members) {
			if (member.did === did) {
				yield member;
			}
		}
	}
}
