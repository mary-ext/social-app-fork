import type { ChatBskyGroupGetJoinLinkPreviews } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { JOIN_LINK_PREVIEW_RQKEY_ROOT } from '#/state/queries/messages/keys';
import { createQueryPersister } from '#/state/query-persister';
import { getClients } from '#/state/session';

const joinLinkPreviewQueryPersister = createQueryPersister({ version: 1 });

/**
 * an entry from a join link preview response. can be a usable preview or a disabled/invalid placeholder.
 * narrow on `$type === 'chat.bsky.group.defs#joinLinkPreviewView'` before reading details.
 */
export type JoinLinkPreview = ChatBskyGroupGetJoinLinkPreviews.$output['joinLinkPreviews'][number];

const createJoinLinkPreviewQueryKey = (args: { codes: string[]; hasSession: boolean }) => [
	JOIN_LINK_PREVIEW_RQKEY_ROOT,
	args,
];

async function fetchJoinLinkPreviews({
	chat,
	codes,
	signal,
}: {
	chat: Client | null;
	codes: string[];
	signal: AbortSignal;
}) {
	if (!chat) {
		throw new Error('Not signed in');
	}
	return await ok(chat.get('chat.bsky.group.getJoinLinkPreviews', { signal, params: { codes } }));
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
	const { chat } = getClients();

	return useQuery({
		queryKey: createJoinLinkPreviewQueryKey({ codes: codes ?? [], hasSession }),
		enabled: codes != null && codes.length > 0,
		staleTime,
		queryFn: async ({ signal }) => {
			if (!codes) {
				throw new Error('No invite code');
			}
			return fetchJoinLinkPreviews({ chat, codes, signal });
		},
		persister: joinLinkPreviewQueryPersister,
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
	const { chat } = getClients();
	const queryClient = useQueryClient();

	return async ({
		code,
		hasSession,
	}: {
		code: string;
		hasSession: boolean;
	}): Promise<JoinLinkPreview | undefined> => {
		try {
			const data = await queryClient.fetchQuery<ChatBskyGroupGetJoinLinkPreviews.$output>({
				queryKey: createJoinLinkPreviewQueryKey({ codes: [code], hasSession }),
				queryFn: ({ signal }) => fetchJoinLinkPreviews({ chat, codes: [code], signal }),
				persister: joinLinkPreviewQueryPersister,
				staleTime: STALE.SECONDS.FIFTEEN,
			});
			return data.joinLinkPreviews[0];
		} catch (error) {
			console.error('Failed to fetch join link preview', error);
			return undefined;
		}
	};
}
