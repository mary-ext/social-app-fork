import type { ChatBskyConvoDefs, ChatBskyConvoListConvos } from '@atcute/bluesky';

import type { Query, QueryKey } from '@tanstack/react-query';

import type { listConvosQueryKey } from '#/state/queries/messages/keys';

export type ConvoListItem = ChatBskyConvoListConvos.$output['convos'][number];

export type ConvoListQueryData = {
	pageParams: Array<string | undefined>;
	pages: Array<ChatBskyConvoListConvos.$output>;
};

/** returns whether a convo satisfies the filters encoded in a convo-list query key. */
export function convoMatchesQueryKey(convo: ConvoListItem, queryKey: QueryKey): boolean {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- callers pair this with a `listConvosQueryKeyPartial` prefix filter
	const [, status, readState, kind, lockStatus] = queryKey as ReturnType<typeof listConvosQueryKey>;
	if (status !== 'all' && status !== convo.status) {
		return false;
	}
	if (readState === 'unread' && convo.unreadCount === 0) {
		return false;
	}
	if (convo.kind?.$type === 'chat.bsky.convo.defs#groupConvo') {
		if (kind === 'direct') {
			return false;
		}
		if (lockStatus && convo.kind.lockStatus !== lockStatus) {
			return false;
		}
	} else {
		if (kind === 'group') {
			return false;
		}
		// direct convos are never locked
		if (lockStatus && lockStatus !== 'unlocked') {
			return false;
		}
	}
	return true;
}

/**
 * query predicate for optimistically upserting a convo into convo-list caches. targets caches whose filters
 * the convo satisfies, plus caches the convo is already in.
 */
export function convoListQueryPredicate(convo: ConvoListItem) {
	return (query: Query): boolean => {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- callers pair this with a `listConvosQueryKeyPartial` prefix filter
		const data = query.state.data as ConvoListQueryData | undefined;
		if (data && getConvoFromQueryData(convo.id, data)) {
			return true;
		}
		return convoMatchesQueryKey(convo, query.queryKey);
	};
}

/**
 * applies an update to a convo in convo-list query data.
 *
 * @param chatId the conversation ID
 * @param old the cached query data
 * @param updateFn the update to apply to the matching convo
 * @returns the updated query data
 */
export function optimisticUpdate(
	chatId: string,
	old?: ConvoListQueryData,
	updateFn?: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
) {
	if (!old || !updateFn) {
		return old;
	}

	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			convos: page.convos.map((convo) => (chatId === convo.id ? updateFn(convo) : convo)),
		})),
	};
}

export function optimisticDelete(chatId: string, old?: ConvoListQueryData) {
	if (!old) {
		return old;
	}

	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			convos: page.convos.filter((convo) => chatId !== convo.id),
		})),
	};
}

export function getConvoFromQueryData(chatId: string, old: ConvoListQueryData) {
	for (const page of old.pages) {
		for (const convo of page.convos) {
			if (convo.id === chatId) {
				return convo;
			}
		}
	}
	return null;
}
