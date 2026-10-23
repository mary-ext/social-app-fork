import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ActorIdentifier, ResourceUri } from '@atcute/lexicons';
import { isDid, parseResourceUri } from '@atcute/lexicons/syntax';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { RQKEY } from '#/state/queries/post/keys';
import { getClients } from '#/state/session';

/**
 * reads a post by AT-URI.
 *
 * @param uri the post's AT-URI; undefined disables the query
 * @param options.staleTime cache freshness in milliseconds; defaults to 0
 * @returns the query result
 */
export function usePostQuery(uri: ResourceUri | undefined, { staleTime }: { staleTime?: number } = {}) {
	const { appview } = getClients();
	return useQuery<AppBskyFeedDefs.PostView>({
		queryKey: RQKEY(uri || ''),
		enabled: !!uri,
		staleTime,
		queryFn: async ({ signal }) => {
			if (!uri) {
				throw new Error('[unreachable] No URI provided');
			}

			const urip = parseResourceUri(uri);

			let repo: ActorIdentifier = urip.repo;
			if (!isDid(repo)) {
				const resolved = await ok(
					appview.get('com.atproto.identity.resolveHandle', {
						signal,
						params: { handle: repo },
					}),
				);
				repo = resolved.did;
			}

			const { posts } = await ok(
				appview.get('app.bsky.feed.getPosts', {
					signal,
					params: { uris: [`at://${repo}/${urip.collection}/${urip.rkey}`] },
				}),
			);
			if (posts[0]) {
				return posts[0];
			}

			throw new Error('No data');
		},
	});
}

export function useGetPost() {
	const queryClient = useQueryClient();
	const { appview } = getClients();
	return async ({ uri }: { uri: ResourceUri }) => {
		return queryClient.fetchQuery({
			queryKey: RQKEY(uri || ''),
			async queryFn({ signal }) {
				const urip = parseResourceUri(uri);

				let repo: ActorIdentifier = urip.repo;
				if (!isDid(repo)) {
					const resolved = await ok(
						appview.get('com.atproto.identity.resolveHandle', {
							signal,
							params: { handle: repo },
						}),
					);
					repo = resolved.did;
				}

				const { posts } = await ok(
					appview.get('app.bsky.feed.getPosts', {
						signal,
						params: { uris: [`at://${repo}/${urip.collection}/${urip.rkey}`] },
					}),
				);

				if (posts[0]) {
					return posts[0];
				}

				throw new Error('useGetPost: post not found');
			},
		});
	};
}
