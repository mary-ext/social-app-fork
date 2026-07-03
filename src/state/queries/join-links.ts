import type { ChatBskyGroupGetJoinLinkPreviews } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';

import { createQueryKey, type StructuredQueryKey } from '#/state/queries/util';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { STALE } from '.';

const joinLinkPreviewQueryKeyRoot = 'join-link-preview';

/**
 * an entry from a join link preview response. can be a usable preview or a disabled/invalid placeholder.
 * narrow on `$type === 'chat.bsky.group.defs#joinLinkPreviewView'` before reading details.
 */
export type JoinLinkPreview = ChatBskyGroupGetJoinLinkPreviews.$output['joinLinkPreviews'][number];

export const createJoinLinkPreviewQueryKey = (args: { codes: string[]; hasSession: boolean }) =>
	createQueryKey(joinLinkPreviewQueryKeyRoot, args, {
		persistedVersion: 1,
	});

/**
 * invalidate join link preview queries whose `codes` include the given code when a link's state changes.
 *
 * @param code the join link code to invalidate
 */
export function invalidateJoinLinkPreviewsForCode(queryClient: QueryClient, code: string) {
	return queryClient.invalidateQueries({
		predicate: (query) => {
			const [root, args] = query.queryKey as Partial<StructuredQueryKey<{ codes?: string[] }>>;
			return root === joinLinkPreviewQueryKeyRoot && Array.isArray(args?.codes) && args.codes.includes(code);
		},
	});
}

/**
 * invalidate join link preview queries for a conversation. use when a user's membership changes so cached
 * previews refetch to reflect their new state.
 */
export function invalidateJoinLinkPreviewsForConvo(queryClient: QueryClient, convoId: string) {
	return queryClient.invalidateQueries({
		predicate: (query) => {
			const [root] = query.queryKey;
			if (root !== joinLinkPreviewQueryKeyRoot) return false;
			const data = query.state.data as ChatBskyGroupGetJoinLinkPreviews.$output | undefined;
			return (
				data?.joinLinkPreviews.some(
					(preview) =>
						preview.$type === 'chat.bsky.group.defs#joinLinkPreviewView' && preview.convoId === convoId,
				) ?? false
			);
		},
	});
}

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

/**
 * fetch or read from cache a single join link preview by code.
 *
 * @param code the invite code
 * @returns the preview, or undefined if it cannot be resolved
 */
export function useGetJoinLinkPreview() {
	const { chat } = useClients();
	const queryClient = useQueryClient();

	return async ({
		code,
		hasSession,
	}: {
		code: string;
		hasSession: boolean;
	}): Promise<JoinLinkPreview | undefined> => {
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
	};
}

/**
 * optimistically set whether the viewer has requested to join the link with the given code across cached join
 * link preview queries
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
					if (preview.$type === 'chat.bsky.group.defs#joinLinkPreviewView' && preview.code === code) {
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
