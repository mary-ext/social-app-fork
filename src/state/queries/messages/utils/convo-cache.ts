import type { ChatBskyConvoDefs, ChatBskyConvoListConvos } from '@atcute/bluesky';

import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query';

import { RQKEY as CONVO_KEY } from '../conversation';
import { RQKEY_ROOT as CONVO_LIST_KEY } from '../list-conversations';

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
	const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(CONVO_KEY(convoId));
	const prevListEntries = queryClient.getQueriesData<InfiniteData<ChatBskyConvoListConvos.$output>>({
		queryKey: [CONVO_LIST_KEY],
	});

	queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(CONVO_KEY(convoId), (prev) => {
		if (!prev) return;
		const next = updater(prev);
		return next ?? prev;
	});

	queryClient.setQueriesData<InfiniteData<ChatBskyConvoListConvos.$output>>(
		{ queryKey: [CONVO_LIST_KEY] },
		(prev) => {
			if (!prev?.pages) return;
			return {
				...prev,
				pages: prev.pages.map((page) => ({
					...page,
					convos: page.convos.map((convo) => {
						if (convo.id !== convoId) return convo;
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
		queryClient.setQueryData(CONVO_KEY(convoId), snapshot.prevConvo);
	}
	for (const [key, data] of snapshot.prevListEntries) {
		queryClient.setQueryData(key, data);
	}
}
