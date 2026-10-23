import type { ChatBskyConvoListConvoRequests } from '@atcute/bluesky';

import type { InfiniteData } from '@tanstack/react-query';

export type ConvoRequestListQueryData = InfiniteData<ChatBskyConvoListConvoRequests.$output>;

/**
 * Optimistically drops an incoming conversation request from the request-list cache, so accepting or
 * rejecting it removes the row before the query refetches.
 */
export function optimisticDelete(convoId: string, old: ConvoRequestListQueryData | undefined) {
	if (!old) {
		return old;
	}
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

/** optimistically zeroes the unread count on every incoming conversation request in the request-list cache */
export function markAllRead(old: ConvoRequestListQueryData | undefined) {
	if (!old) {
		return old;
	}
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
	if (!old) {
		return old;
	}
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
