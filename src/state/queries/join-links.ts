import { useCallback } from 'react';
import type { ChatBskyGroupDefs, ChatBskyGroupGetJoinLinkPreviews } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { createQueryKey } from '#/state/queries/util';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { STALE } from '.';

const joinLinkPreviewQueryKeyRoot = 'join-link-preview';

export const createJoinLinkPreviewQueryKey = (args: { codes: string[]; hasSession: boolean }) =>
	createQueryKey(joinLinkPreviewQueryKeyRoot, args, {
		persistedVersion: 1,
	});

async function fetchJoinLinkPreviews({ chat, codes }: { chat: Client | null; codes: string[] }) {
	if (!chat) throw new Error('Not signed in');
	return await ok(chat.get('chat.bsky.group.getJoinLinkPreviews', { params: { codes } }));
}

export function useJoinLinkPreviewsQuery({
	codes,
	hasSession,
	staleTime = STALE.MINUTES.ONE,
	initialData,
}: {
	codes?: string[];
	hasSession: boolean;
	staleTime?: number;
	/**
	 * Seed the query with an already-known preview (e.g. a DM message embed already carries the resolved view),
	 * avoiding a duplicate fetch.
	 */
	initialData?: ChatBskyGroupGetJoinLinkPreviews.$output;
}) {
	const { chat } = useClients();

	return useQuery({
		queryKey: createJoinLinkPreviewQueryKey({ codes: codes ?? [], hasSession }),
		queryFn: async () => {
			if (!codes) throw new Error('No invite code');
			try {
				return await fetchJoinLinkPreviews({ chat, codes });
			} catch (error) {
				logger.error('Failed to fetch join link preview', { safeMessage: error });
				throw error;
			}
		},
		enabled: codes != null && codes.length > 0,
		staleTime,
		initialData,
	});
}

export function usePrefetchJoinLinkPreviews() {
	const { chat } = useClients();
	const queryClient = useQueryClient();

	return ({ codes, hasSession }: { codes: string[]; hasSession: boolean }) => {
		return queryClient.prefetchQuery({
			queryKey: createJoinLinkPreviewQueryKey({ codes, hasSession }),
			queryFn: () => fetchJoinLinkPreviews({ chat, codes }),
			staleTime: STALE.SECONDS.FIFTEEN,
		});
	};
}

/**
 * Imperatively fetch (or read from cache) a single join link preview by code. Used when sending a DM invite
 * embed so we can build an optimistic view. Returns undefined if the preview can't be resolved.
 */
export function useGetJoinLinkPreview() {
	const { chat } = useClients();
	const queryClient = useQueryClient();

	return useCallback(
		async ({
			code,
			hasSession,
		}: {
			code: string;
			hasSession: boolean;
		}): Promise<ChatBskyGroupDefs.JoinLinkPreviewView | undefined> => {
			try {
				const data = await queryClient.fetchQuery({
					queryKey: createJoinLinkPreviewQueryKey({ codes: [code], hasSession }),
					queryFn: () => fetchJoinLinkPreviews({ chat, codes: [code] }),
					staleTime: STALE.SECONDS.FIFTEEN,
				});
				return data.joinLinkPreviews[0];
			} catch (error) {
				logger.error('Failed to fetch join link preview', { safeMessage: error });
				return undefined;
			}
		},
		[chat, queryClient],
	);
}
