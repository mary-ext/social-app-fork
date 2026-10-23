import type { ChatBskyGroupGetJoinLinkPreviews } from '@atcute/bluesky';

import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { JOIN_LINK_PREVIEW_RQKEY_ROOT } from '#/state/queries/messages/keys';

/** matches a join link preview query key whose `codes` argument contains `code`. */
const joinLinkPreviewKeyHasCode = (queryKey: QueryKey, code: string) => {
	const [root, args] = queryKey;
	if (root !== JOIN_LINK_PREVIEW_RQKEY_ROOT) {
		return false;
	}
	if (typeof args !== 'object' || args === null || !('codes' in args)) {
		return false;
	}
	return Array.isArray(args.codes) && args.codes.includes(code);
};

/**
 * invalidate join link preview queries whose `codes` include the given code when a link's state changes.
 *
 * @param code the join link code to invalidate
 */
export function invalidateJoinLinkPreviewsForCode(queryClient: QueryClient, code: string) {
	return queryClient.invalidateQueries({
		predicate: (query) => joinLinkPreviewKeyHasCode(query.queryKey, code),
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
			if (root !== JOIN_LINK_PREVIEW_RQKEY_ROOT) {
				return false;
			}
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the root check above pins the cache entry
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
			predicate: (query) => joinLinkPreviewKeyHasCode(query.queryKey, code),
		},
		(old) => {
			if (!old) {
				return old;
			}
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
