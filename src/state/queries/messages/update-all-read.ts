import type { ChatBskyConvoListConvos } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { RQKEY as CONVO_LIST_KEY } from './list-conversations';

export function useUpdateAllRead(
	status: 'accepted' | 'request',
	{
		onSuccess,
		onMutate,
		onError,
	}: {
		onMutate?: () => void;
		onSuccess?: () => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async () => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.post('chat.bsky.convo.updateAllRead', {
					input: { status },
				}),
			);

			return data;
		},
		onMutate: () => {
			let prevPages: ChatBskyConvoListConvos.$output[] = [];
			queryClient.setQueryData(
				CONVO_LIST_KEY(status),
				(old?: { pageParams: Array<string | undefined>; pages: Array<ChatBskyConvoListConvos.$output> }) => {
					if (!old) return old;
					prevPages = old.pages;
					return {
						...old,
						pages: old.pages.map((page) => {
							return {
								...page,
								convos: page.convos.map((convo) => {
									return {
										...convo,
										unreadCount: 0,
									};
								}),
							};
						}),
					};
				},
			);
			// remove unread convos from the badge query
			queryClient.setQueryData(
				CONVO_LIST_KEY('all', 'unread'),
				(old?: { pageParams: Array<string | undefined>; pages: Array<ChatBskyConvoListConvos.$output> }) => {
					if (!old) return old;
					return {
						...old,
						pages: old.pages.map((page) => {
							return {
								...page,
								convos: page.convos.filter((convo) => convo.status !== status),
							};
						}),
					};
				},
			);
			onMutate?.();
			return { prevPages };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CONVO_LIST_KEY(status) });
			onSuccess?.();
		},
		onError: (error, _, context) => {
			logger.error(error);
			queryClient.setQueryData(
				CONVO_LIST_KEY(status),
				(old?: { pageParams: Array<string | undefined>; pages: Array<ChatBskyConvoListConvos.$output> }) => {
					if (!old) return old;
					return {
						...old,
						pages: context?.prevPages || old.pages,
					};
				},
			);
			queryClient.invalidateQueries({ queryKey: CONVO_LIST_KEY(status) });
			queryClient.invalidateQueries({ queryKey: CONVO_LIST_KEY('all', 'unread') });
			onError?.(error);
		},
	});
}
