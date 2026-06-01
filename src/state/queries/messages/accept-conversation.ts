import type { ChatBskyConvoAcceptConvo, ChatBskyConvoListConvos } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { RQKEY as CONVO_LIST_KEY, RQKEY_ROOT as CONVO_LIST_ROOT_KEY } from './list-conversations';

export function useAcceptConversation(
	convoId: string,
	{
		onSuccess,
		onMutate,
		onError,
	}: {
		onMutate?: () => void;
		onSuccess?: (data: ChatBskyConvoAcceptConvo.$output) => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async () => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(chat.post('chat.bsky.convo.acceptConvo', { input: { convoId } }));

			return data;
		},
		onMutate: () => {
			let prevAcceptedPages: ChatBskyConvoListConvos.$output[] = [];
			let prevInboxPages: ChatBskyConvoListConvos.$output[] = [];
			let convoBeingAccepted: ChatBskyConvoListConvos.$output['convos'][number] | undefined;
			queryClient.setQueryData(
				CONVO_LIST_KEY('request'),
				(old?: { pageParams: Array<string | undefined>; pages: Array<ChatBskyConvoListConvos.$output> }) => {
					if (!old) return old;
					prevInboxPages = old.pages;
					return {
						...old,
						pages: old.pages.map((page) => {
							const found = page.convos.find((convo) => convo.id === convoId);
							if (found) {
								convoBeingAccepted = found;
								return {
									...page,
									convos: page.convos.filter((convo) => convo.id !== convoId),
								};
							}
							return page;
						}),
					};
				},
			);
			queryClient.setQueryData(
				CONVO_LIST_KEY('accepted'),
				(old?: { pageParams: Array<string | undefined>; pages: Array<ChatBskyConvoListConvos.$output> }) => {
					if (!old) return old;
					prevAcceptedPages = old.pages;
					if (convoBeingAccepted) {
						return {
							...old,
							pages: [
								{
									...old.pages[0],
									convos: [
										{
											...convoBeingAccepted,
											status: 'accepted',
										},
										...old.pages[0]!.convos,
									],
								},
								...old.pages.slice(1),
							],
						};
					} else {
						return old;
					}
				},
			);
			onMutate?.();
			return { prevAcceptedPages, prevInboxPages };
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: [CONVO_LIST_KEY] });
			onSuccess?.(data);
		},
		onError: (error, _, context) => {
			logger.error(error);
			queryClient.setQueryData(
				CONVO_LIST_KEY('accepted'),
				(old?: { pageParams: Array<string | undefined>; pages: Array<ChatBskyConvoListConvos.$output> }) => {
					if (!old) return old;
					return {
						...old,
						pages: context?.prevAcceptedPages || old.pages,
					};
				},
			);
			queryClient.setQueryData(
				CONVO_LIST_KEY('request'),
				(old?: { pageParams: Array<string | undefined>; pages: Array<ChatBskyConvoListConvos.$output> }) => {
					if (!old) return old;
					return {
						...old,
						pages: context?.prevInboxPages || old.pages,
					};
				},
			);
			queryClient.invalidateQueries({ queryKey: [CONVO_LIST_ROOT_KEY] });
			onError?.(error);
		},
	});
}
