import type {
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyUnspeccedDefs,
	AppBskyUnspeccedGetPostThreadOtherV2,
	AppBskyUnspeccedGetPostThreadV2,
} from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';

import { dangerousGetPostShadow, updatePostShadow } from '#/state/cache/post-shadow';
import { registerShadowFinders } from '#/state/cache/registry';
import { findAllPostsInQueryData as findAllPostsInBookmarksQueryData } from '#/state/queries/bookmarks/useBookmarksQuery';
import { findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData } from '#/state/queries/explore-feed-previews';
import { findAllPostsInQueryData as findAllPostsInNotifsQueryData } from '#/state/queries/notifications/feed';
import { findAllPostsInQueryData as findAllPostsInFeedQueryData } from '#/state/queries/post-feed';
import { findAllPostsInQueryData as findAllPostsInQuoteQueryData } from '#/state/queries/post-quotes';
import { findAllPostsInQueryData as findAllPostsInSearchQueryData } from '#/state/queries/search-posts';
import { usePostThreadContext } from '#/state/queries/usePostThread';
import { getBranch } from '#/state/queries/usePostThread/traversal';
import {
	type ApiThreadItem,
	type createPostThreadOtherQueryKey,
	type createPostThreadQueryKey,
	type PostThreadParams,
	postThreadQueryKeyRoot,
} from '#/state/queries/usePostThread/types';
import { getRootPostAtUri } from '#/state/queries/usePostThread/utils';
import { postViewToThreadPlaceholder } from '#/state/queries/usePostThread/views';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost } from '#/state/queries/util';

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
	for (const item of getThreadPlaceholderCandidates(queryClient, uri)) {
		// quoted posts may lack metrics; keep searching for a complete view.
		const hasAllInfo = item.value.post.likeCount != null;
		if (hasAllInfo) {
			return item;
		} else {
			partial = item;
		}
	}
	return partial;
}

export function* getThreadPlaceholderCandidates(
	queryClient: QueryClient,
	uri: string,
): Generator<
	$type.enforce<
		Omit<AppBskyUnspeccedGetPostThreadV2.ThreadItem, 'value'> & {
			value: $type.enforce<AppBskyUnspeccedDefs.ThreadItemPost>;
		}
	>,
	void
> {
	for (const post of findAllPostsInQueryData(queryClient, uri)) {
		yield postViewToThreadPlaceholder(post);
	}

	// notification views often have fresh engagement counts.
	for (const post of findAllPostsInNotifsQueryData(queryClient, uri)) {
		yield postViewToThreadPlaceholder(post);
	}
	for (const post of findAllPostsInFeedQueryData(queryClient, uri)) {
		yield postViewToThreadPlaceholder(post);
	}
	for (const post of findAllPostsInQuoteQueryData(queryClient, uri)) {
		yield postViewToThreadPlaceholder(post);
	}
	for (const post of findAllPostsInSearchQueryData(queryClient, uri)) {
		yield postViewToThreadPlaceholder(post);
	}
	for (const post of findAllPostsInBookmarksQueryData(queryClient, uri)) {
		yield postViewToThreadPlaceholder(post);
	}
	for (const post of findAllPostsInExploreFeedPreviewsQueryData(queryClient, uri)) {
		yield postViewToThreadPlaceholder(post);
	}
}

export function* findAllPostsInQueryData(
	queryClient: QueryClient,
	uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
	const atUri = parseResourceUri(uri);
	const queryDatas = queryClient.getQueriesData<AppBskyUnspeccedGetPostThreadV2.$output>({
		queryKey: [postThreadQueryKeyRoot],
	});

	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData) {
			continue;
		}

		const { thread } = queryData;

		for (const item of thread) {
			if (item.value.$type === 'app.bsky.unspecced.defs#threadItemPost') {
				if (didOrHandleUriMatches(atUri, item.value.post)) {
					yield item.value.post;
				}

				const qp = getEmbeddedPost(item.value.post.embed);
				if (qp && didOrHandleUriMatches(atUri, qp)) {
					yield embedViewRecordToPostView(qp);
				}
			}
		}
	}
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileViewBasic, void> {
	const queryDatas = queryClient.getQueriesData<AppBskyUnspeccedGetPostThreadV2.$output>({
		queryKey: [postThreadQueryKeyRoot],
	});

	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData) {
			continue;
		}

		const { thread } = queryData;

		for (const item of thread) {
			if (item.value.$type === 'app.bsky.unspecced.defs#threadItemPost') {
				if (item.value.post.author.did === did) {
					yield item.value.post.author;
				}

				const qp = getEmbeddedPost(item.value.post.embed);
				if (qp && qp.author.did === did) {
					yield qp.author;
				}
			}
		}
	}
}

export function useUpdatePostThreadThreadgateQueryCache() {
	const qc = useQueryClient();
	const context = usePostThreadContext();

	return (threadgate: AppBskyFeedDefs.ThreadgateView) => {
		if (!context) {
			return;
		}

		function mutator<T>(thread: ApiThreadItem[]): T[] {
			for (let i = 0; i < thread.length; i++) {
				const item = thread[i]!;

				if (item.value.$type !== 'app.bsky.unspecced.defs#threadItemPost') {
					continue;
				}

				if (item.depth === 0) {
					thread.splice(i, 1, {
						...item,
						value: {
							...item.value,
							post: {
								...item.value.post,
								threadgate,
							},
						},
					});
				}
			}

			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the caller pins `T` to the query's thread-item variant
			return thread as T[];
		}

		qc.setQueryData<AppBskyUnspeccedGetPostThreadV2.$output>(context.postThreadQueryKey, (data) => {
			if (!data) {
				return;
			}
			return {
				...data,
				thread: mutator<AppBskyUnspeccedGetPostThreadV2.ThreadItem>([...data.thread]),
			};
		});
	};
}

registerShadowFinders(postThreadQueryKeyRoot, {
	findPosts: findAllPostsInQueryData,
	findProfiles: findAllProfilesInQueryData,
});
