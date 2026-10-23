import type { ChatBskyConvoDefs, ChatBskyConvoListConvos } from '@atcute/bluesky';

import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query';

import { convoQueryKey, LIST_CONVOS_RQKEY_ROOT } from '#/state/queries/messages/keys';

/**
 * seeds the single-conversation cache. a view no newer than the cached one is ignored.
 *
 * @param queryClient the query client
 * @param convo the conversation view to seed from
 */
export function precacheConvoQuery(queryClient: QueryClient, convo: ChatBskyConvoDefs.ConvoView) {
	queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(convoQueryKey(convo.id), (old) => {
		// `<=` because the cached copy may carry an optimistic update on top of the same server state
		if (old && convo.rev <= old.rev) {
			return old;
		}
		return convo;
	});
}

type ConvoUpdater = (prev: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView | undefined;

export type ConvoCacheSnapshot = {
	prevConvo: ChatBskyConvoDefs.ConvoView | undefined;
	prevListEntries: Array<[QueryKey, InfiniteData<ChatBskyConvoListConvos.$output> | undefined]>;
};

/**
 * writes an optimistic update to a convo across both the single-convo and convo-list caches.
 *
 * @param updater receives the current ConvoView and returns the next one, or undefined to bail out.
 * @returns a snapshot that can be passed to `rollbackConvoOptimistic`.
 */
export function updateConvoOptimistic(
	queryClient: QueryClient,
	convoId: string,
	updater: ConvoUpdater,
): ConvoCacheSnapshot {
	const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(convoQueryKey(convoId));
	const prevListEntries = queryClient.getQueriesData<InfiniteData<ChatBskyConvoListConvos.$output>>({
		queryKey: [LIST_CONVOS_RQKEY_ROOT],
	});

	queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(convoQueryKey(convoId), (prev) => {
		if (!prev) {
			return;
		}
		const next = updater(prev);
		return next ?? prev;
	});

	queryClient.setQueriesData<InfiniteData<ChatBskyConvoListConvos.$output>>(
		{ queryKey: [LIST_CONVOS_RQKEY_ROOT] },
		(prev) => {
			if (!prev?.pages) {
				return;
			}
			return {
				...prev,
				pages: prev.pages.map((page) => ({
					...page,
					convos: page.convos.map((convo) => {
						if (convo.id !== convoId) {
							return convo;
						}
						const next = updater(convo);
						return next ?? convo;
					}),
				})),
			};
		},
	);

	return { prevConvo, prevListEntries };
}

/** Restores the caches to the state captured by `updateConvoOptimistic`. */
export function rollbackConvoOptimistic(
	queryClient: QueryClient,
	convoId: string,
	snapshot: ConvoCacheSnapshot,
) {
	if (snapshot.prevConvo) {
		queryClient.setQueryData(convoQueryKey(convoId), snapshot.prevConvo);
	}
	for (const [key, data] of snapshot.prevListEntries) {
		queryClient.setQueryData(key, data);
	}
}
