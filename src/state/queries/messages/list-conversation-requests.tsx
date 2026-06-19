import type { ChatBskyConvoListConvoRequests } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';

import { useClients } from '#/state/session';

const DEFAULT_LIMIT = 10;

export const RQKEY_ROOT = 'convo-request-list';
export const RQKEY = (limit: number = DEFAULT_LIMIT) => [RQKEY_ROOT, limit];

export function useListConvoRequests({
	enabled = true,
	limit = DEFAULT_LIMIT,
}: { enabled?: boolean; limit?: number } = {}) {
	const { chat } = useClients();

	return useInfiniteQuery({
		enabled,
		queryKey: RQKEY(limit),
		queryFn: async ({ pageParam }) => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.get('chat.bsky.convo.listConvoRequests', {
					params: { limit, cursor: pageParam },
				}),
			);
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

export type ConvoRequestListQueryData = InfiniteData<ChatBskyConvoListConvoRequests.$output>;

/**
 * Optimistically drops an incoming conversation request from the request-list cache, so accepting or
 * rejecting it removes the row before the query refetches.
 */
export function optimisticDelete(convoId: string, old: ConvoRequestListQueryData | undefined) {
	if (!old) return old;
	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			requests: page.requests.filter(
				(item) => item.$type !== 'chat.bsky.convo.defs#convoView' || item.id !== convoId,
			),
		})),
	};
}

/**
 * Optimistically zeroes the unread count on every incoming conversation request in the request-list cache, so
 * "mark all as read" clears the inbox before the query refetches.
 */
export function markAllRead(old: ConvoRequestListQueryData | undefined) {
	if (!old) return old;
	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			requests: page.requests.map((item) =>
				item.$type === 'chat.bsky.convo.defs#convoView' ? { ...item, unreadCount: 0 } : item,
			),
		})),
	};
}

/**
 * Optimistically drops an outgoing group join-request from the request-list cache, so rescinding it removes
 * the row before the query refetches.
 */
export function optimisticDeleteJoinRequest(convoId: string, old: ConvoRequestListQueryData | undefined) {
	if (!old) return old;
	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			requests: page.requests.filter(
				(item) => item.$type !== 'chat.bsky.group.defs#joinRequestConvoView' || item.convoId !== convoId,
			),
		})),
	};
}
