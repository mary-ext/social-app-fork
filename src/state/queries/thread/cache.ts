import type { AppBskyUnspeccedGetPostThreadOtherV2, AppBskyUnspeccedGetPostThreadV2 } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';

import type { QueryClient } from '@tanstack/react-query';

import { dangerousGetPostShadow, updatePostShadow } from '#/state/cache/post-shadow';
import { getPostFinders } from '#/state/cache/registry';
import type { createPostThreadOtherQueryKey, createPostThreadQueryKey } from '#/state/queries/thread/keys';
import { getBranch } from '#/state/queries/thread/lib/traversal';
import { getRootPostAtUri } from '#/state/queries/thread/lib/utils';
import { postViewToThreadPlaceholder } from '#/state/queries/thread/lib/views';
import type { ApiThreadItem, PostThreadParams } from '#/state/queries/thread/types';

export function createCacheMutator({
	queryClient,
	postThreadQueryKey,
	postThreadOtherQueryKey,
	params,
}: {
	queryClient: QueryClient;
	postThreadQueryKey: ReturnType<typeof createPostThreadQueryKey>;
	postThreadOtherQueryKey: ReturnType<typeof createPostThreadOtherQueryKey>;
	params: Pick<PostThreadParams, 'view'> & { below: number };
}) {
	return {
		insertReplies: (parentUri: string, replies: AppBskyUnspeccedGetPostThreadV2.ThreadItem[]) => {
			queryClient.setQueryData<AppBskyUnspeccedGetPostThreadV2.$output>(postThreadQueryKey, (data) => {
				if (!data) {
					return;
				}
				return {
					...data,
					thread: mutator<AppBskyUnspeccedGetPostThreadV2.ThreadItem>([...data.thread]),
				};
			});

			queryClient.setQueryData<AppBskyUnspeccedGetPostThreadOtherV2.$output>(
				postThreadOtherQueryKey,
				(data) => {
					if (!data) {
						return;
					}
					return {
						...data,
						thread: mutator<AppBskyUnspeccedGetPostThreadOtherV2.ThreadItem>([...data.thread]),
					};
				},
			);

			function mutator<T>(thread: ApiThreadItem[]): T[] {
				for (let i = 0; i < thread.length; i++) {
					const parent = thread[i]!;

					if (parent.value.$type !== 'app.bsky.unspecced.defs#threadItemPost') {
						continue;
					}
					if (parent.uri !== parentUri) {
						continue;
					}

					const shadow = dangerousGetPostShadow(parent.value.post);
					const prevOptimisticCount = shadow?.optimisticReplyCount;
					const prevReplyCount = parent.value.post.replyCount;
					// preserve an optimistic count when present.
					const currentReplyCount = (prevOptimisticCount ?? prevReplyCount ?? 0) + 1;

					// traversal reads the count from the query cache.
					parent.value.post.replyCount = currentReplyCount;

					updatePostShadow(queryClient, parent.value.post.uri, {
						optimisticReplyCount: currentReplyCount,
					});

					const opDid = getRootPostAtUri(parent.value.post)?.repo;
					const nextPreexistingItem = thread.at(i + 1);
					const isEndOfReplyChain = !nextPreexistingItem || nextPreexistingItem.depth <= parent.depth;
					const isParentRoot = parent.depth === 0;
					const isParentBelowRoot = parent.depth > 0;
					const optimisticReply = replies.at(0);
					const opIsReplier =
						optimisticReply?.value.$type === 'app.bsky.unspecced.defs#threadItemPost'
							? opDid === optimisticReply.value.post.author.did
							: false;

					const canAlwaysInsertReplies =
						isParentRoot ||
						(params.view === 'tree' && isParentBelowRoot) ||
						(params.view === 'linear' && isEndOfReplyChain);
					const shouldReplaceWithOPReplies = params.view === 'linear' && opIsReplier && isParentBelowRoot;

					if (canAlwaysInsertReplies || shouldReplaceWithOPReplies) {
						const branch = getBranch(thread, i, parent.depth);
						const itemsToRemove = shouldReplaceWithOPReplies ? branch.length : 0;
						const itemsToInsert = replies
							.map((r, ri) => {
								r.depth = parent.depth + 1 + ri;
								return r;
							})
							.filter((r) => {
								// omit replies outside the visible depth.
								return r.depth <= params.below;
							});

						thread.splice(i + 1, itemsToRemove, ...itemsToInsert);
					}
				}

				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the caller pins `T` to the query's thread-item variant
				return thread as T[];
			}
		},
		deletePost(post: AppBskyUnspeccedGetPostThreadV2.ThreadItem) {
			queryClient.setQueryData<AppBskyUnspeccedGetPostThreadV2.$output>(postThreadQueryKey, (queryData) => {
				if (!queryData) {
					return;
				}

				const thread = [...queryData.thread];

				for (let i = 0; i < thread.length; i++) {
					const existingPost = thread[i]!;
					if (post.value.$type !== 'app.bsky.unspecced.defs#threadItemPost') {
						continue;
					}

					if (existingPost.uri === post.uri) {
						const branch = getBranch(thread, i, existingPost.depth);
						thread.splice(branch.start, branch.length);
						break;
					}
				}

				return {
					...queryData,
					thread,
				};
			});
		},
	};
}

export function getThreadPlaceholder(
	queryClient: QueryClient,
	uri: string,
): $type.enforce<AppBskyUnspeccedGetPostThreadV2.ThreadItem> | void {
	let partial;
	for (const findPosts of getPostFinders()) {
		for (const post of findPosts(queryClient, uri)) {
			const item = postViewToThreadPlaceholder(post);
			// quoted posts may lack metrics; keep searching for a complete view.
			const hasAllInfo = item.value.post.likeCount != null;
			if (hasAllInfo) {
				return item;
			} else {
				partial = item;
			}
		}
	}
	return partial;
}
