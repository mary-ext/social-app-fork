import { useMemo } from 'react';
import type { ChatBskyConvoLeaveConvo, ChatBskyConvoListConvos } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { RQKEY_ROOT as CONVO_LIST_KEY } from './list-conversations';

const RQKEY_ROOT = 'leave-convo';
export function RQKEY(convoId: string | undefined) {
	return [RQKEY_ROOT, convoId];
}

export function useLeaveConvo(
	convoId: string | undefined,
	{
		onSuccess,
		onMutate,
		onError,
	}: {
		onMutate?: () => void;
		onSuccess?: (data: ChatBskyConvoLeaveConvo.$output) => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationKey: RQKEY(convoId),
		mutationFn: async () => {
			if (!convoId) throw new Error('No convoId provided');
			if (!chat) throw new Error('Not signed in');

			const data = await ok(
				chat.post('chat.bsky.convo.leaveConvo', {
					input: { convoId },
				}),
			);

			return data;
		},
		onMutate: () => {
			let prevPages: ChatBskyConvoListConvos.$output[] = [];
			queryClient.setQueryData(
				[CONVO_LIST_KEY],
				(old?: { pageParams: Array<string | undefined>; pages: Array<ChatBskyConvoListConvos.$output> }) => {
					if (!old) return old;
					prevPages = old.pages;
					return {
						...old,
						pages: old.pages.map((page) => {
							return {
								...page,
								convos: page.convos.filter((convo) => convo.id !== convoId),
							};
						}),
					};
				},
			);
			onMutate?.();
			return { prevPages };
		},
		onSuccess: (data) => {
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_KEY] });
			onSuccess?.(data);
		},
		onError: (error, _, context) => {
			logger.error(error);
			queryClient.setQueryData(
				[CONVO_LIST_KEY],
				(old?: { pageParams: Array<string | undefined>; pages: Array<ChatBskyConvoListConvos.$output> }) => {
					if (!old) return old;
					return {
						...old,
						pages: context?.prevPages || old.pages,
					};
				},
			);
			void queryClient.invalidateQueries({ queryKey: [CONVO_LIST_KEY] });
			onError?.(error);
		},
	});
}

/**
 * Gets currently pending and successful leave convo mutations
 *
 * @returns Array of `convoId`
 */
export function useLeftConvos() {
	const pending = useMutationState({
		filters: { mutationKey: [RQKEY_ROOT], status: 'pending' },
		select: (mutation) => mutation.options.mutationKey?.[1] as string | undefined,
	});
	const success = useMutationState({
		filters: { mutationKey: [RQKEY_ROOT], status: 'success' },
		select: (mutation) => mutation.options.mutationKey?.[1] as string | undefined,
	});
	return useMemo(() => [...pending, ...success].filter((id) => id !== undefined), [pending, success]);
}
