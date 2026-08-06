import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { ResourceUri } from '@atcute/lexicons';

import { getPostRecord } from '#/lib/api/record-casts';

import type {
	ApiThreadItem,
	PostThreadParams,
	ThreadItem,
	TraversalMetadata,
} from '#/state/queries/usePostThread/types';
import {
	getThreadPostNoUnauthenticatedUI,
	getThreadPostUI,
	getTraversalMetadata,
	storeTraversalMetadata,
} from '#/state/queries/usePostThread/utils';
import * as views from '#/state/queries/usePostThread/views';

export function sortAndAnnotateThreadItems(
	thread: ApiThreadItem[],
	{
		threadgateHiddenReplies,
		moderationOpts,
		view,
		skipModerationHandling,
	}: {
		threadgateHiddenReplies: ReadonlySet<ResourceUri>;
		moderationOpts: ModerationOptions;
		view: PostThreadParams['view'];
		/** include all replies without moderation sorting or truncation. */
		skipModerationHandling?: boolean;
	},
) {
	const threadItems: ThreadItem[] = [];
	const otherThreadItems: ThreadItem[] = [];
	const metadatas = new Map<string, TraversalMetadata>();

	traversal: for (let i = 0; i < thread.length; i++) {
		const item = thread[i]!;
		let parentMetadata: TraversalMetadata | undefined;
		let metadata: TraversalMetadata | undefined;

		if (item.value.$type === 'app.bsky.unspecced.defs#threadItemPost') {
			parentMetadata = metadatas.get(getPostRecord(item.value.post).reply?.parent?.uri || '');
			metadata = getTraversalMetadata({
				item,
				parentMetadata,
				prevItem: thread.at(i - 1),
				nextItem: thread.at(i + 1),
			});
			storeTraversalMetadata(metadatas, metadata);
		}

		if (item.depth < 0) {
		} else if (item.depth === 0) {
			if (item.value.$type === 'app.bsky.unspecced.defs#threadItemNoUnauthenticated') {
				threadItems.push(
					views.threadPostNoUnauthenticated({
						uri: item.uri,
						depth: item.depth,
						value: item.value,
					}),
				);
			} else if (item.value.$type === 'app.bsky.unspecced.defs#threadItemNotFound') {
				threadItems.push(views.threadPostNotFound({ uri: item.uri, depth: item.depth, value: item.value }));
			} else if (item.value.$type === 'app.bsky.unspecced.defs#threadItemBlocked') {
				threadItems.push(views.threadPostBlocked({ uri: item.uri, depth: item.depth, value: item.value }));
			} else if (item.value.$type === 'app.bsky.unspecced.defs#threadItemPost') {
				const post = views.threadPost({
					uri: item.uri,
					depth: item.depth,
					value: item.value,
					moderationOpts,
					threadgateHiddenReplies,
				});
				threadItems.push(post);

				parentTraversal: for (let pi = i - 1; pi >= 0; pi--) {
					const parent = thread[pi]!;

					if (parent.value.$type === 'app.bsky.unspecced.defs#threadItemNoUnauthenticated') {
						const parentPost = views.threadPostNoUnauthenticated({
							uri: parent.uri,
							depth: parent.depth,
							value: parent.value,
						});
						parentPost.ui = getThreadPostNoUnauthenticatedUI({
							depth: parent.depth,
							nextItemDepth: thread[pi + 1]?.depth,
						});
						threadItems.unshift(parentPost);
						break parentTraversal;
					} else if (parent.value.$type === 'app.bsky.unspecced.defs#threadItemNotFound') {
						threadItems.unshift(
							views.threadPostNotFound({ uri: parent.uri, depth: parent.depth, value: parent.value }),
						);
						break parentTraversal;
					} else if (parent.value.$type === 'app.bsky.unspecced.defs#threadItemBlocked') {
						threadItems.unshift(
							views.threadPostBlocked({ uri: parent.uri, depth: parent.depth, value: parent.value }),
						);
						break parentTraversal;
					} else if (parent.value.$type === 'app.bsky.unspecced.defs#threadItemPost') {
						threadItems.unshift(
							views.threadPost({
								uri: parent.uri,
								depth: parent.depth,
								value: parent.value,
								moderationOpts,
								threadgateHiddenReplies,
							}),
						);
					}
				}
			}
		} else if (item.depth > 0) {
			const shouldBreak =
				item.value.$type === 'app.bsky.unspecced.defs#threadItemNoUnauthenticated' ||
				item.value.$type === 'app.bsky.unspecced.defs#threadItemNotFound' ||
				item.value.$type === 'app.bsky.unspecced.defs#threadItemBlocked';

			if (shouldBreak) {
				const branch = getBranch(thread, i, item.depth);
				i = branch.end;
				continue traversal;
			} else if (item.value.$type === 'app.bsky.unspecced.defs#threadItemPost') {
				if (parentMetadata) {
					// assign before incrementing the 1-based counter.
					metadata!.replyIndex = parentMetadata.repliesSeenCounter;
				}

				const post = views.threadPost({
					uri: item.uri,
					depth: item.depth,
					value: item.value,
					moderationOpts,
					threadgateHiddenReplies,
				});

				if (!post.isBlurred || skipModerationHandling) {
					threadItems.push(post);

					if (parentMetadata) {
						parentMetadata.repliesSeenCounter += 1;
					}
				} else {
					const parent = post;
					const parentIsTopLevelReply = parent.depth === 1;
					const branch = getBranch(thread, i, item.depth);

					if (parentIsTopLevelReply) {
						otherThreadItems.push(parent);
						const startIndex = branch.start + 1;

						for (let ci = startIndex; ci <= branch.end; ci++) {
							const child = thread[ci]!;

							if (child.value.$type === 'app.bsky.unspecced.defs#threadItemPost') {
								const childParentMetadata = metadatas.get(
									getPostRecord(child.value.post).reply?.parent?.uri || '',
								);
								const childMetadata = getTraversalMetadata({
									item: child,
									prevItem: thread[ci - 1],
									nextItem: thread[ci + 1],
									parentMetadata: childParentMetadata,
								});
								storeTraversalMetadata(metadatas, childMetadata);
								if (childParentMetadata) {
									// assign before incrementing the 1-based counter.
									childMetadata.replyIndex = childParentMetadata.repliesSeenCounter;
								}

								const childPost = views.threadPost({
									uri: child.uri,
									depth: child.depth,
									value: child.value,
									moderationOpts,
									threadgateHiddenReplies,
								});

								if (childPost.isBlurred) {
									ci = getBranch(thread, ci, child.depth).end;
								} else {
									otherThreadItems.push(childPost);

									if (childParentMetadata) {
										childParentMetadata.repliesSeenCounter += 1;
									}
								}
							} else {
								break;
							}
						}
					}

					i = branch.end;
					continue traversal;
				}
			}
		}
	}

	// compute final UI metadata after moderation removes branches.
	for (const subset of [threadItems, otherThreadItems]) {
		for (let i = 0; i < subset.length; i++) {
			const item = subset[i]!;
			const prevItem = subset.at(i - 1);
			const nextItem = subset.at(i + 1);

			if (item.type === 'threadPost') {
				const metadata = metadatas.get(item.uri);

				if (metadata) {
					// record neighboring depths after filtering.
					if (prevItem?.type === 'threadPost') {
						metadata.prevItemDepth = prevItem?.depth;
					}
					if (nextItem?.type === 'threadPost') {
						metadata.nextItemDepth = nextItem?.depth;
					}

					// a child ends before an item at the same or shallower depth.
					metadata.isLastChild =
						metadata.nextItemDepth === undefined || metadata.nextItemDepth <= metadata.depth;

					if (metadata.parentMetadata) {
						const isLastSiblingDueToMissingReplies =
							metadata.replyIndex === metadata.parentMetadata.repliesSeenCounter - 1;

						// a shallower next item ends this sibling.
						const isImplicitlyLastSibling =
							metadata.nextItemDepth === undefined || metadata.nextItemDepth < metadata.depth;

						metadata.isLastSibling = isImplicitlyLastSibling || isLastSiblingDueToMissingReplies;

						if (metadata.isLastSibling) {
							metadata.isPartOfLastBranchFromDepth = metadata.depth;

							if (!metadata.isLastSibling && metadata.parentMetadata.isPartOfLastBranchFromDepth) {
								metadata.isPartOfLastBranchFromDepth = metadata.parentMetadata.isPartOfLastBranchFromDepth;
							}
						}

						if (metadata.parentMetadata.repliesUnhydrated > 0 && metadata.isLastSibling) {
							metadata.upcomingParentReadMore = metadata.parentMetadata;
						}

						if (metadata.parentMetadata.upcomingParentReadMore) {
							metadata.upcomingParentReadMore = metadata.parentMetadata.upcomingParentReadMore;
						}

						metadata.skippedIndentIndices = new Set(metadata.parentMetadata.skippedIndentIndices);

						if (metadata.parentMetadata.repliesUnhydrated <= 0 && metadata.isLastSibling) {
							metadata.skippedIndentIndices.add(item.depth - 2);
						}
					}

					if (metadata.repliesUnhydrated > 0 && metadata.isLastChild) {
						metadata.precedesChildReadMore = true;
						subset.splice(i + 1, 0, views.readMore(metadata));
						i++;
					}

					// add the parent's read-more marker at the end of its branch.
					if (
						view === 'tree' &&
						metadata.upcomingParentReadMore &&
						metadata.isPartOfLastBranchFromDepth &&
						metadata.isPartOfLastBranchFromDepth >= metadata.upcomingParentReadMore.depth &&
						(metadata.nextItemDepth === undefined ||
							metadata.nextItemDepth <= metadata.upcomingParentReadMore.depth)
					) {
						subset.splice(i + 1, 0, views.readMore(metadata.upcomingParentReadMore));
						i++;
					}

					if (item.value.moreParents) {
						metadata.followsReadMoreUp = true;
						subset.splice(i, 0, views.readMoreUp(metadata));
						i++;
					}

					item.ui = getThreadPostUI(metadata);
				}
			}
		}
	}

	return {
		threadItems,
		otherThreadItems,
	};
}

export function buildThread({
	threadItems,
	otherThreadItems,
	serverOtherThreadItems,
	isLoading,
	hasSession,
	otherItemsVisible,
	hasOtherThreadItems,
	showOtherItems,
}: {
	threadItems: ThreadItem[];
	otherThreadItems: ThreadItem[];
	serverOtherThreadItems: ThreadItem[];
	isLoading: boolean;
	hasSession: boolean;
	otherItemsVisible: boolean;
	hasOtherThreadItems: boolean;
	showOtherItems: () => void;
}) {
	// copy memoized items before adding rows.
	const items = [...threadItems];

	if (isLoading) {
		const anchorPost = items.at(0);
		const hasAnchorFromCache = anchorPost && anchorPost.type === 'threadPost';
		const skeletonReplies = hasAnchorFromCache ? (anchorPost.value.post.replyCount ?? 4) : 4;

		if (!items.length) {
			items.push(
				views.skeleton({
					key: 'anchor-skeleton',
					item: 'anchor',
				}),
			);
		}

		if (hasSession) {
			const replyDisabled = hasAnchorFromCache && anchorPost.value.post.viewer?.replyDisabled === true;

			if (hasAnchorFromCache) {
				if (!replyDisabled) {
					items.push({
						type: 'replyComposer',
						key: 'replyComposer',
					});
				}
			} else {
				items.push(
					views.skeleton({
						key: 'replyComposer',
						item: 'replyComposer',
					}),
				);
			}
		}

		for (let i = 0; i < skeletonReplies; i++) {
			items.push(
				views.skeleton({
					key: `anchor-skeleton-reply-${i}`,
					item: 'reply',
				}),
			);
		}
	} else {
		for (let i = 0; i < items.length; i++) {
			const item = items[i]!;
			if (
				item.type === 'threadPost' &&
				item.depth === 0 &&
				!item.value.post.viewer?.replyDisabled &&
				hasSession
			) {
				items.splice(i + 1, 0, {
					type: 'replyComposer',
					key: 'replyComposer',
				});
				break;
			}
		}

		if (otherThreadItems.length || hasOtherThreadItems) {
			if (otherItemsVisible) {
				items.push(...otherThreadItems);
				items.push(...serverOtherThreadItems);
			} else {
				items.push({
					type: 'showOtherReplies',
					key: 'showOtherReplies',
					onPress: showOtherItems,
				});
			}
		}
	}

	return items;
}

/**
 * returns the inclusive range of a thread branch.
 *
 * @param thread the list of items in the thread
 * @param branchStartIndex the index of the parent item
 * @param branchStartDepth the depth of the parent item
 * @returns the start and end index, and the length of the branch
 */
export function getBranch(thread: ApiThreadItem[], branchStartIndex: number, branchStartDepth: number) {
	let end = branchStartIndex;

	for (let ci = branchStartIndex + 1; ci < thread.length; ci++) {
		const next = thread[ci]!;
		if (next.depth > branchStartDepth) {
			end = ci;
		} else {
			end = ci - 1;
			break;
		}
	}

	return {
		start: branchStartIndex,
		end,
		length: end - branchStartIndex,
	};
}
