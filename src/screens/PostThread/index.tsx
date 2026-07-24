import { startTransition, useEffect, useRef, useState } from 'react';

import type { ResourceUri } from '@atcute/lexicons';

import { clsx } from 'clsx';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { useOpenComposer, type OnPostSuccessData } from '#/lib/hooks/useOpenComposer';

import { useFeedFeedback } from '#/state/feed-feedback';
import type { ThreadViewOption } from '#/state/queries/preferences/useThreadPreferences';
import { PostThreadContextProvider, type ThreadItem, usePostThread } from '#/state/queries/usePostThread';
import { useSession } from '#/state/session';
import { useUnstablePostSource } from '#/state/unstable-post-source';

import { HeaderDropdown } from '#/screens/PostThread/components/HeaderDropdown';
import { ThreadComposePrompt } from '#/screens/PostThread/components/ThreadComposePrompt';
import { ThreadError } from '#/screens/PostThread/components/ThreadError';
import { ThreadItemAnchor, ThreadItemAnchorSkeleton } from '#/screens/PostThread/components/ThreadItemAnchor';
import { ThreadItemAnchorNoUnauthenticated } from '#/screens/PostThread/components/ThreadItemAnchorNoUnauthenticated';
import { ThreadItemPost, ThreadItemPostSkeleton } from '#/screens/PostThread/components/ThreadItemPost';
import { ThreadItemPostNoUnauthenticated } from '#/screens/PostThread/components/ThreadItemPostNoUnauthenticated';
import { ThreadItemPostTombstone } from '#/screens/PostThread/components/ThreadItemPostTombstone';
import { ThreadItemReadMore } from '#/screens/PostThread/components/ThreadItemReadMore';
import { ThreadItemReadMoreUp } from '#/screens/PostThread/components/ThreadItemReadMoreUp';
import { ThreadItemReplyComposerSkeleton } from '#/screens/PostThread/components/ThreadItemReplyComposerSkeleton';
import { ThreadItemShowOtherReplies } from '#/screens/PostThread/components/ThreadItemShowOtherReplies';
import {
	ThreadItemTreePost,
	ThreadItemTreePostSkeleton,
} from '#/screens/PostThread/components/ThreadItemTreePost';
import * as css from '#/screens/PostThread/index.css';

import { List, type ListMethods } from '#/components/List/List';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useIsFocused } from '#/routes';

const PARENT_CHUNK_SIZE = 20;
const CHILDREN_CHUNK_SIZE = 50;

/** Height the trailing spacer falls back to when the thread has no parents. */
const FALLBACK_FOOTER_HEIGHT = 180;

// Measured threads skew toward short text replies (~110px), punctuated by a tall anchor and occasional media.
const ITEM_HEIGHT_ESTIMATE = 200;

export function PostThread({ uri }: { uri: ResourceUri }) {
	const { gtMobile } = useBreakpoints();
	const { hasSession } = useSession();
	const headerRef = useRef<HTMLDivElement>(null);
	const isFocused = useIsFocused();
	const listRef = useRef<ListMethods>(null);
	const needsInitialAnchor = useRef(true);
	const anchorPostSource = useUnstablePostSource(uri);
	const feedFeedback = useFeedFeedback(anchorPostSource?.feedSourceInfo, hasSession);

	/*
	 * One query to rule them all
	 */
	const thread = usePostThread({ anchor: uri });
	const { anchor, hasParents } = (() => {
		let sawParents = false;
		for (const item of thread.data.items) {
			if (item.type === 'threadPost' && item.depth === 0) {
				return { anchor: item, hasParents: sawParents };
			}
			sawParents = true;
		}
		return { hasParents: sawParents };
	})();

	const { openComposer } = useOpenComposer();
	const optimisticOnPostReply = useNonReactiveCallback((payload: OnPostSuccessData) => {
		if (payload) {
			const { replyToUri, posts } = payload;
			if (replyToUri && posts.length) {
				thread.actions.insertReplies(replyToUri, posts);
			}
		}
	});
	const onReplyToAnchor = useNonReactiveCallback(() => {
		if (anchor?.type !== 'threadPost') {
			return;
		}
		const post = anchor.value.post;
		openComposer({
			replyTo: {
				uri: anchor.uri,
				cid: post.cid,
				text: post.record.text,
				author: post.author,
				embed: post.embed,
				moderation: anchor.moderation,
				langs: post.record.langs,
			},
			onPostSuccess: optimisticOnPostReply,
		});

		if (anchorPostSource) {
			feedFeedback.sendInteraction({
				item: post.uri,
				event: 'app.bsky.feed.defs#interactionReply',
				feedContext: anchorPostSource.post.feedContext,
				reqId: anchorPostSource.post.reqId,
			});
		}
	});

	const canReply = !anchor?.value.post?.viewer?.replyDisabled;
	const [maxParentCount, setMaxParentCount] = useState(PARENT_CHUNK_SIZE);
	const [maxChildrenCount, setMaxChildrenCount] = useState(CHILDREN_CHUNK_SIZE);

	// withhold parents until the anchor has painted as the first item: avoids the cold-load flash of the
	// thread top before the scroll-to-anchor, and gates initial pagination until layout settles. re-armed on
	// view/sort changes.
	const [deferParents, setDeferParents] = useState(true);

	const setAnchorNode = (node: HTMLDivElement | null) => {
		if (node) {
			setDeferParents(false);
		}
	};

	/** prepares the UI to maintain the scroll position at the anchor post when thread parameters change. */
	const prepareForParamsUpdate = () => {
		needsInitialAnchor.current = true;

		// make the anchor the first item again so the virtualizer can preserve it when the new parents return.
		setDeferParents(true);
		// reset this to a lower value for faster re-render
		setMaxChildrenCount(CHILDREN_CHUNK_SIZE);
	};

	const setSortWrapped = (sort: string) => {
		prepareForParamsUpdate();
		thread.actions.setSort(sort);
	};

	const setViewWrapped = (view: ThreadViewOption) => {
		prepareForParamsUpdate();
		thread.actions.setView(view);
	};

	// total parents/children around the anchor post (depth === 0), used to short-circuit pagination once all
	// items are loaded. derived from the items rather than stashed in refs, so it stays off the render path.
	let totalParents: number;
	let totalChildren: number;
	{
		const anchorIndex = thread.data.items.findIndex((item) => 'depth' in item && item.depth === 0);
		if (anchorIndex === -1) {
			totalParents = 0;
			totalChildren = thread.data.items.length;
		} else {
			totalParents = anchorIndex;
			totalChildren = thread.data.items.length - 1 - anchorIndex;
		}
	}

	const onStartReached = () => {
		if (thread.state.isFetching) {
			return;
		}
		// can be true after `prepareForParamsUpdate` is called
		if (deferParents) {
			return;
		}
		// prevent any state mutations if we know we're done
		if (maxParentCount >= totalParents) {
			return;
		}
		setMaxParentCount((n) => n + PARENT_CHUNK_SIZE);
	};

	const onEndReached = () => {
		if (thread.state.isFetching) {
			return;
		}
		// can be true after `prepareForParamsUpdate` is called
		if (deferParents) {
			return;
		}
		// prevent any state mutations if we know we're done
		if (maxChildrenCount >= totalChildren) {
			return;
		}
		setMaxChildrenCount((prev) => prev + CHILDREN_CHUNK_SIZE);
	};

	const slices: ThreadItem[] = [];
	if (thread.data.items.length) {
		/*
		 * Pagination hack, tracks the # of items below the anchor post.
		 */
		let childrenCount = 0;

		for (let i = 0; i < thread.data.items.length; i++) {
			const item = thread.data.items[i]!;
			/*
			 * Need to check `depth`, since not found or blocked posts are not
			 * `threadPost`s, but still have `depth`.
			 */
			const hasDepth = 'depth' in item;

			/*
			 * Handle anchor post.
			 */
			if (hasDepth && item.depth === 0) {
				slices.push(item);

				/*
				 * Walk up the parents, limiting by `maxParentCount`
				 */
				if (!deferParents) {
					const start = i - 1;
					if (start >= 0) {
						const limit = Math.max(0, start - maxParentCount);
						for (let pi = start; pi >= limit; pi--) {
							slices.unshift(thread.data.items[pi]!);
						}
					}
				}
			} else {
				// ignore any parent items
				if (item.type === 'readMoreUp' || (hasDepth && item.depth < 0)) {
					continue;
				}
				// can exit early if we've reached the max children count
				if (childrenCount > maxChildrenCount) {
					break;
				}

				slices.push(item);
				childrenCount++;
			}
		}
	}

	/** defers rendering of reply skeletons to prevent blocking the initial paint of the cached anchor post. */
	const [showReplySkeletons, setShowReplySkeletons] = useState(false);
	useEffect(() => {
		if (thread.state.isPlaceholderData && !showReplySkeletons) {
			startTransition(() => {
				setShowReplySkeletons(true);
			});
		}
	}, [thread.state.isPlaceholderData, showReplySkeletons]);

	const deferredSlices = showReplySkeletons
		? slices
		: slices.filter((item) => !(item.type === 'skeleton' && item.item === 'reply'));
	const anchorIndex = deferredSlices.findIndex((item) => 'depth' in item && item.depth === 0);

	useEffect(() => {
		if (!isFocused || deferParents || anchorIndex === -1 || !needsInitialAnchor.current) {
			return;
		}

		const animationFrame = requestAnimationFrame(() => {
			if (
				listRef.current?.scrollToIndex({
					index: anchorIndex,
					offset: headerRef.current?.getBoundingClientRect().bottom,
				})
			) {
				needsInitialAnchor.current = false;
			}
		});
		return () => cancelAnimationFrame(animationFrame);
	}, [anchorIndex, deferParents, isFocused]);

	let isTombstoneView = false;
	if (deferredSlices.length <= 1) {
		isTombstoneView = deferredSlices.every(
			(s) => s.type === 'threadPostBlocked' || s.type === 'threadPostNotFound',
		);
	}

	const renderItem = ({ item, index }: { item: ThreadItem; index: number }) => {
		if (item.type === 'threadPost') {
			if (item.depth < 0) {
				return (
					<ThreadItemPost
						item={item}
						threadgateRecord={thread.data.threadgate?.record}
						overrides={{
							topBorder: index === 0,
						}}
						onPostSuccess={optimisticOnPostReply}
					/>
				);
			} else if (item.depth === 0) {
				return (
					<div>
						{/*
						 * IMPORTANT: this is a load-bearing key. We want the anchor marker
						 * to remount any time the thread params change so that `deferParents`
						 * is always reset to `false` once the anchor post is rendered.
						 *
						 * If we ever add additional thread params to this screen, they will
						 * need to be added here.
						 */}
						<div key={item.uri + thread.state.view + thread.state.sort} ref={setAnchorNode} />
						<ThreadItemAnchor
							item={item}
							threadgateRecord={thread.data.threadgate?.record}
							onPostSuccess={optimisticOnPostReply}
							postSource={anchorPostSource}
						/>
					</div>
				);
			} else {
				if (thread.state.view === 'tree') {
					return (
						<ThreadItemTreePost
							item={item}
							threadgateRecord={thread.data.threadgate?.record}
							overrides={{
								moderation: thread.state.otherItemsVisible && item.depth > 0,
							}}
							onPostSuccess={optimisticOnPostReply}
						/>
					);
				} else {
					return (
						<ThreadItemPost
							item={item}
							threadgateRecord={thread.data.threadgate?.record}
							overrides={{
								moderation: thread.state.otherItemsVisible && item.depth > 0,
							}}
							onPostSuccess={optimisticOnPostReply}
						/>
					);
				}
			}
		} else if (item.type === 'threadPostNoUnauthenticated') {
			if (item.depth === 0) {
				return <ThreadItemAnchorNoUnauthenticated />;
			} else {
				return <ThreadItemPostNoUnauthenticated item={item} />;
			}
		} else if (item.type === 'readMore') {
			return <ThreadItemReadMore item={item} view={thread.state.view === 'tree' ? 'tree' : 'linear'} />;
		} else if (item.type === 'readMoreUp') {
			return <ThreadItemReadMoreUp item={item} />;
		} else if (item.type === 'threadPostBlocked') {
			return <ThreadItemPostTombstone type="blocked" />;
		} else if (item.type === 'threadPostNotFound') {
			return <ThreadItemPostTombstone type="not-found" />;
		} else if (item.type === 'replyComposer') {
			if (gtMobile) {
				return <ThreadComposePrompt onPressCompose={onReplyToAnchor} />;
			}
		} else if (item.type === 'showOtherReplies') {
			return <ThreadItemShowOtherReplies onPress={item.onPress} />;
		} else if (item.type === 'skeleton') {
			if (item.item === 'anchor') {
				return <ThreadItemAnchorSkeleton />;
			} else if (item.item === 'reply') {
				if (thread.state.view === 'linear') {
					return <ThreadItemPostSkeleton index={index} />;
				} else {
					return <ThreadItemTreePostSkeleton index={index} />;
				}
			} else if (item.item === 'replyComposer') {
				return <ThreadItemReplyComposerSkeleton />;
			}
		}
		return null;
	};

	const defaultListFooterHeight = hasParents ? window.innerHeight - 200 : undefined;

	return (
		<PostThreadContextProvider context={thread.context}>
			<Layout.Header.Outer ref={headerRef}>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['navigation.post.title']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot>
					<HeaderDropdown
						sort={thread.state.sort}
						setSort={setSortWrapped}
						view={thread.state.view}
						setView={setViewWrapped}
					/>
				</Layout.Header.Slot>
			</Layout.Header.Outer>
			{thread.state.error ? (
				<ThreadError error={thread.state.error} onRetry={() => void thread.actions.refetch()} />
			) : (
				<List
					ref={listRef}
					data={deferredSlices}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					estimateHeight={ITEM_HEIGHT_ESTIMATE}
					onStartReached={onStartReached}
					onStartReachedThreshold={1}
					onEndReached={onEndReached}
					onEndReachedThreshold={4}
					ListFooterComponent={
						<div
							className={clsx(css.footer, isTombstoneView && css.footerNoBorder)}
							style={{ height: defaultListFooterHeight ?? FALLBACK_FOOTER_HEIGHT }}
						/>
					}
				/>
			)}
			{!gtMobile && canReply && hasSession && <MobileComposePrompt onPressReply={onReplyToAnchor} />}
		</PostThreadContextProvider>
	);
}

function MobileComposePrompt({ onPressReply }: { onPressReply: () => unknown }) {
	return (
		<div className={css.mobileComposePrompt}>
			<ThreadComposePrompt onPressCompose={onPressReply} />
		</div>
	);
}

const keyExtractor = (item: ThreadItem) => {
	return item.key;
};
