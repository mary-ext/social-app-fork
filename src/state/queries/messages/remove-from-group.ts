import type {
	ChatBskyActorDefs,
	ChatBskyConvoDefs,
	ChatBskyConvoListConvos,
	ChatBskyGroupRemoveMembers,
} from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { RQKEY as CONVO_KEY } from './conversation';
import { RQKEY_ROOT as CONVO_LIST_KEY } from './list-conversations';
import { listConvoMembersQueryKey } from './list-convo-members';

export function useRemoveFromGroupChat(
	convoId: string | undefined,
	{
		onSuccess,
		onError,
	}: {
		onSuccess?: (data: ChatBskyGroupRemoveMembers.$output) => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async ({ members }: { members: string[] }) => {
			if (!convoId) throw new Error('No convoId provided');
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.post('chat.bsky.group.removeMembers', {
					input: { convoId, members: members as Did[] },
				}),
			);
			return data;
		},
		onMutate: ({ members }) => {
			if (!convoId) return;

			const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(CONVO_KEY(convoId));
			const prevListEntries = queryClient.getQueriesData<InfiniteData<ChatBskyConvoListConvos.$output>>({
				queryKey: [CONVO_LIST_KEY],
			});
			const prevMemberList = queryClient.getQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(
				listConvoMembersQueryKey(convoId),
			);

			queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(CONVO_KEY(convoId), (prev) => {
				if (!prev) return;
				const nextMembers = prev.members.filter((m) => !members.includes(m.did));
				const removed = prev.members.length - nextMembers.length;
				if (prev.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') {
					return { ...prev, members: nextMembers };
				}
				return {
					...prev,
					members: nextMembers,
					kind: {
						...prev.kind,
						memberCount: Math.max(0, prev.kind.memberCount - removed),
					},
				};
			});

			queryClient.setQueriesData<InfiniteData<ChatBskyConvoListConvos.$output>>(
				{ queryKey: [CONVO_LIST_KEY] },
				(prev) => {
					if (!prev?.pages) return;
					return {
						...prev,
						pages: prev.pages.map((page) => ({
							...page,
							convos: page.convos.map((convo) => {
								if (convo.id !== convoId) return convo;
								const nextMembers = convo.members.filter((m) => !members.includes(m.did));
								const removed = convo.members.length - nextMembers.length;
								if (convo.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') {
									return { ...convo, members: nextMembers };
								}
								return {
									...convo,
									members: nextMembers,
									kind: {
										...convo.kind,
										memberCount: Math.max(0, convo.kind.memberCount - removed),
									},
								};
							}),
						})),
					};
				},
			);

			queryClient.setQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(
				listConvoMembersQueryKey(convoId),
				(prev) => {
					if (!prev) return;
					return prev.filter((m) => !members.includes(m.did));
				},
			);

			return { prevConvo, prevListEntries, prevMemberList };
		},
		onSuccess: (data) => {
			onSuccess?.(data);
		},
		onError: (e, _variables, context) => {
			logger.error(e);
			if (context?.prevConvo && convoId) {
				queryClient.setQueryData(CONVO_KEY(convoId), context.prevConvo);
			}
			if (context?.prevListEntries) {
				for (const [key, data] of context.prevListEntries) {
					queryClient.setQueryData(key, data);
				}
			}
			if (context?.prevMemberList && convoId) {
				queryClient.setQueryData(listConvoMembersQueryKey(convoId), context.prevMemberList);
			}
			onError?.(e);
		},
	});
}
