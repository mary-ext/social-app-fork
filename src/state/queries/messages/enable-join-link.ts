import type { ChatBskyGroupEnableJoinLink } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateJoinLinkPreviewsForCode } from '#/state/queries/join-links';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { rollbackConvoOptimistic, updateConvoOptimistic } from './utils/convo-cache';

export function useEnableJoinLink(
	convoId: string | undefined,
	{
		onSuccess,
		onError,
	}: {
		onSuccess?: (data: ChatBskyGroupEnableJoinLink.$output) => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = useClients();

	return useMutation({
		mutationFn: async () => {
			if (!convoId) throw new Error('No convoId provided');
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.post('chat.bsky.group.enableJoinLink', {
					input: { convoId },
				}),
			);
			return data;
		},
		onMutate: () => {
			if (!convoId) return;
			return updateConvoOptimistic(queryClient, convoId, (prev) => {
				if (prev.kind?.$type !== 'chat.bsky.convo.defs#groupConvo' || !prev.kind.joinLink) {
					return undefined;
				}
				return {
					...prev,
					kind: {
						...prev.kind,
						joinLink: { ...prev.kind.joinLink, enabledStatus: 'enabled' },
					},
				};
			});
		},
		onSuccess: (data) => {
			if (convoId) {
				updateConvoOptimistic(queryClient, convoId, (prev) => {
					if (prev.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') return undefined;
					return {
						...prev,
						kind: { ...prev.kind, joinLink: data.joinLink },
					};
				});
			}
			void invalidateJoinLinkPreviewsForCode(queryClient, data.joinLink.code);
			onSuccess?.(data);
		},
		onError: (e, _variables, context) => {
			logger.error(e);
			if (convoId && context) {
				rollbackConvoOptimistic(queryClient, convoId, context);
			}
			onError?.(e);
		},
	});
}
