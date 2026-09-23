import type { ChatBskyConvoDefs } from '@atcute/bluesky';

import type { QueryClient } from '@tanstack/react-query';

export const RQKEY_ROOT = 'convo';

/**
 * builds the query key for a single conversation.
 *
 * @param convoId the conversation ID
 * @returns the query key
 */
export const RQKEY = (convoId: string) => [RQKEY_ROOT, convoId];

/**
 * seeds the single-conversation cache. a view no newer than the cached one is ignored.
 *
 * @param queryClient the query client
 * @param convo the conversation view to seed from
 */
export function precacheConvoQuery(queryClient: QueryClient, convo: ChatBskyConvoDefs.ConvoView) {
	queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(RQKEY(convo.id), (old) => {
		// `<=` because the cached copy may carry an optimistic update on top of the same server state
		if (old && convo.rev <= old.rev) {
			return old;
		}
		return convo;
	});
}
