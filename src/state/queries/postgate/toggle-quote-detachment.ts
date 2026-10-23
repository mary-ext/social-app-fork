import { useRef } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createMaybeDetachedQuoteEmbed } from '#/lib/embed-views';
import { createPostgateRecord, mergePostgateRecords } from '#/lib/postgate';

import { updatePostShadow } from '#/state/cache/post-shadow';
import { useGetPost } from '#/state/queries/post/post';
import { upsertPostgate } from '#/state/queries/postgate/lib/record';
import { getClients, useSession } from '#/state/session';

export function useToggleQuoteDetachmentMutation() {
	const { appview, pds } = getClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	const getPost = useGetPost();
	const prevEmbed = useRef<AppBskyFeedDefs.PostView['embed']>(undefined);

	return useMutation({
		mutationFn: async ({
			post,
			quoteUri,
			action,
		}: {
			post: AppBskyFeedDefs.PostView;
			quoteUri: ResourceUri;
			action: 'detach' | 'reattach';
		}) => {
			// cache here since post shadow mutates original object
			prevEmbed.current = post.embed;

			if (action === 'detach') {
				updatePostShadow(queryClient, post.uri, {
					embed: createMaybeDetachedQuoteEmbed({
						post,
						quote: undefined,
						quoteUri,
						detached: true,
					}),
				});
			}

			await upsertPostgate({ appview, did: currentAccount!.did, pds: pds!, postUri: quoteUri }, (prev) => {
				if (prev) {
					if (action === 'detach') {
						return mergePostgateRecords(prev, {
							detachedEmbeddingUris: [post.uri],
						});
					} else if (action === 'reattach') {
						return {
							...prev,
							detachedEmbeddingUris: prev.detachedEmbeddingUris?.filter((uri) => uri !== post.uri) || [],
						};
					}
				} else {
					if (action === 'detach') {
						return createPostgateRecord({
							post: quoteUri,
							detachedEmbeddingUris: [post.uri],
						});
					}
				}
			});
		},
		async onSuccess(_data, { post, quoteUri, action }) {
			if (action === 'reattach') {
				try {
					const quote = await getPost({ uri: quoteUri });
					updatePostShadow(queryClient, post.uri, {
						embed: createMaybeDetachedQuoteEmbed({
							post,
							quote,
							quoteUri: undefined,
							detached: false,
						}),
					});
				} catch (e) {
					// ok if this fails, it's just optimistic UI
					console.error('Postgate: failed to get quote post for re-attachment', e);
				}
			}
		},
		onError(_, { post, action }) {
			if (action === 'detach' && prevEmbed.current) {
				// detach failed, add the embed back
				if (
					prevEmbed.current?.$type === 'app.bsky.embed.record#view' ||
					prevEmbed.current?.$type === 'app.bsky.embed.recordWithMedia#view'
				) {
					updatePostShadow(queryClient, post.uri, {
						embed: prevEmbed.current,
					});
				}
			}
		},
		onSettled() {
			prevEmbed.current = undefined;
		},
	});
}
