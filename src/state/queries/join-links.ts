import { useCallback } from 'react';
import type { ChatBskyGroupDefs, ChatBskyGroupGetJoinLinkPreviews } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';

import { createQueryKey, type StructuredQueryKey } from '#/state/queries/util';
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

/**
 * Optimistically set whether the viewer has requested to join the link with the given code, across any cached
 * join link preview queries. Used right after a successful join request (requested = true) or withdrawal
 * (requested = false) so the UI ("Requested" vs "Request to join") updates immediately, without waiting on a
 * server refetch that can lag behind the write.
 */
export function setJoinLinkPreviewRequestedForCode(
	queryClient: QueryClient,
	code: string,
	requested: boolean,
) {
	queryClient.setQueriesData<ChatBskyGroupGetJoinLinkPreviews.$output>(
		{
			predicate: (query) => {
				const [root, args] = query.queryKey as Partial<StructuredQueryKey<{ codes?: string[] }>>;
				return (
					root === joinLinkPreviewQueryKeyRoot && Array.isArray(args?.codes) && args.codes.includes(code)
				);
			},
		},
		(old) => {
			if (!old) return old;
			return {
				...old,
				joinLinkPreviews: old.joinLinkPreviews.map((preview) => {
					if (preview.code === code) {
						return {
							...preview,
							viewer: {
								...preview.viewer,
								requestedAt: requested ? new Date().toISOString() : undefined,
							},
						};
					}
					return preview;
				}),
			};
		},
	);
}
