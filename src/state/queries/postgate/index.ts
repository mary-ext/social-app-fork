import { useRef } from 'react';

import type { AppBskyFeedDefs, AppBskyFeedPostgate } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { isDid, parseResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getRecord, putRecord } from '#/lib/api/records';
import { networkRetry, retry } from '#/lib/async/retry';
import { errorMessage } from '#/lib/strings/errors';

import { updatePostShadow } from '#/state/cache/post-shadow';
import { STALE } from '#/state/queries';
import { useGetPosts } from '#/state/queries/post';
import {
	createMaybeDetachedQuoteEmbed,
	createPostgateRecord,
	mergePostgateRecords,
	POSTGATE_COLLECTION,
} from '#/state/queries/postgate/util';
import { getClients, useSession } from '#/state/session';

import { logger } from '#/logger';

export async function getPostgateRecord({
	appview,
	pds,
	postUri,
}: {
	appview: Client;
	pds: Client;
	postUri: ResourceUri;
}): Promise<AppBskyFeedPostgate.Main | undefined> {
	const urip = parseResourceUri(postUri);

	const repo = isDid(urip.repo)
		? urip.repo
		: (
				await ok(
					appview.get('com.atproto.identity.resolveHandle', {
						params: { handle: urip.repo },
					}),
				)
			).did;

	try {
		const data = await retry(
			2,
			(e) => {
				/*
				 * If the record doesn't exist, we want to return null instead of
				 * throwing an error. NB: This will also catch reference errors, such as
				 * a typo in the URI.
				 */
				if (e instanceof Error && e.message.includes(`Could not locate record:`)) {
					return false;
				}
				return true;
			},
			() =>
				getRecord(pds, {
					collection: POSTGATE_COLLECTION,
					repo,
					rkey: urip.rkey!,
				}),
		);

		return data.value ?? undefined;
	} catch (e) {
		/*
		 * If the record doesn't exist, we want to return null instead of
		 * throwing an error. NB: This will also catch reference errors, such as
		 * a typo in the URI.
		 */
		if (e instanceof Error && e.message.includes(`Could not locate record:`)) {
			return undefined;
		} else {
			throw e;
		}
	}
}

export async function writePostgateRecord({
	did,
	pds,
	postUri,
	postgate,
}: {
	did: Did;
	pds: Client;
	postUri: ResourceUri;
	postgate: AppBskyFeedPostgate.Main;
}) {
	const postUrip = parseResourceUri(postUri);

	await networkRetry(2, () =>
		putRecord(pds, {
			collection: POSTGATE_COLLECTION,
			record: postgate,
			repo: did,
			rkey: postUrip.rkey!,
		}),
	);
}

export async function upsertPostgate(
	{
		appview,
		did,
		pds,
		postUri,
	}: {
		appview: Client;
		did: Did;
		pds: Client;
		postUri: ResourceUri;
	},
	callback: (
		postgate: AppBskyFeedPostgate.Main | undefined,
	) => AppBskyFeedPostgate.Main | Promise<AppBskyFeedPostgate.Main | undefined> | undefined,
) {
	const prev = await getPostgateRecord({
		appview,
		pds,
		postUri,
	});
	const next = await callback(prev);
	if (!next) {
		return;
	}
	await writePostgateRecord({
		did,
		pds,
		postUri,
		postgate: next,
	});
}

export const createPostgateQueryKey = (postUri: string) => ['postgate-record', postUri];
export function usePostgateQuery({ postUri }: { postUri: ResourceUri }) {
	const { appview, pds } = getClients();
	return useQuery({
		staleTime: STALE.SECONDS.THIRTY,
		queryKey: createPostgateQueryKey(postUri),
		async queryFn() {
			return await getPostgateRecord({ appview, pds: pds!, postUri }).then((res) => res ?? null);
		},
	});
}

export function useWritePostgateMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			postUri,
			postgate,
		}: {
			postUri: ResourceUri;
			postgate: AppBskyFeedPostgate.Main;
		}) => {
			return writePostgateRecord({
				did: currentAccount!.did,
				pds: pds!,
				postUri,
				postgate,
			});
		},
		onSuccess(_, { postUri }) {
			void queryClient.invalidateQueries({
				queryKey: createPostgateQueryKey(postUri),
			});
		},
	});
}

export function useToggleQuoteDetachmentMutation() {
	const { appview, pds } = getClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	const getPosts = useGetPosts();
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
					const [quote] = await getPosts({ uris: [quoteUri] });
					updatePostShadow(queryClient, post.uri, {
						embed: createMaybeDetachedQuoteEmbed({
							post,
							quote: quote!,
							quoteUri: undefined,
							detached: false,
						}),
					});
				} catch (e) {
					// ok if this fails, it's just optimistic UI
					logger.error(`Postgate: failed to get quote post for re-attachment`, {
						safeMessage: errorMessage(e),
					});
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
