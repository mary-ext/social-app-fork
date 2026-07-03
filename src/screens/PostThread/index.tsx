import { startTransition, useCallback, useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';

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

import { useBreakpoints } from '#/alf';

import { List, type ListMethods } from '#/components/List/List';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

const PARENT_CHUNK_SIZE = 20;
const CHILDREN_CHUNK_SIZE = 50;

/** Height the trailing spacer falls back to when the thread has no parents. */
const FALLBACK_FOOTER_HEIGHT = 180;

// Measured threads skew toward short text replies (~110px), punctuated by a tall anchor and occasional media.
const ITEM_HEIGHT_ESTIMATE = 200;

export function PostThread({ uri }: { uri: string }) {
	const { gtMobile } = useBreakpoints();
	const { hasSession } = useSession();
	const anchorPostSource = useUnstablePostSource(uri);
	const feedFeedback = useFeedFeedback(anchorPostSource?.feedSourceInfo, hasSession);

	/*
	 * One query to rule them all
	 */
	const thread = usePostThread({ anchor: uri });
	const { anchor, hasParents } = (() => {
		let hasParents = false;
		for (const item of thread.data.items) {
			if (item.type === 'threadPost' && item.depth === 0) {
				return { anchor: item, hasParents };
			}
			hasParents = true;
		}
		return { hasParents };
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

	const isRoot = !!anchor && anchor.value.post.record.reply === undefined;
	const canReply = !anchor?.value.post?.viewer?.replyDisabled;
	const [maxParentCount, setMaxParentCount] = useState(PARENT_CHUNK_SIZE);
	const [maxChildrenCount, setMaxChildrenCount] = useState(CHILDREN_CHUNK_SIZE);
	const listRef = useRef<ListMethods>(null);
	const anchorRef = useRef<HTMLDivElement | null>(null);
	const headerRef = useRef<HTMLDivElement | null>(null);

	/*
	 * On a cold load, parents are not prepended until the anchor post has
	 * rendered as the first item in the list. This gives us a consistent
	 * reference point for which to pin the anchor post to the top of the screen.
	 *
	 * We simulate a cold load any time the user changes the view or sort params
	 * so that this handling is consistent.
	 *
	 * `onContentSizeChange` is used to get ahead of next paint and handle this
	 * scrolling.
	 */
	const [deferParents, setDeferParents] = useState(true);

	/**
	 * callback ref for the marker at the top of the anchor post. triggers when thread parameters change to
	 * reset parent deferral and serves as the measurement node for scroll pinning.
	 *
	 * @param node the DOM element or null
	 */
	const setAnchorNode = useCallback((node: HTMLDivElement | null) => {
		anchorRef.current = node;
		if (node) {
			setDeferParents(false);
		}
	}, []);

	/** whether to scroll to the anchor post. true on cold load or when thread parameters change. */
	const shouldHandleScroll = useRef(true);
	/**
	 * Callback triggered when the content size of the list changes.
	 *
	 * Used to pin the anchor as the first item upon view changes.
	 */
	const onContentSizeChangeWebOnly = () => {
		const list = listRef.current;
		const anchor = anchorRef.current;
		const header = headerRef.current;

		if (list && anchor && header && shouldHandleScroll.current) {
			const anchorOffsetTop = anchor.getBoundingClientRect().top;
			const headerHeight = header.getBoundingClientRect().height;

			/*
			 * `deferParents` is `true` on a cold load, and always reset to
			 * `true` when params change via `prepareForParamsUpdate`.
			 *
			 * On a cold load or a push to a new post, on the first pass of this
			 * logic, the anchor post is the first item in the list. Therefore
			 * `anchorOffsetTop - headerHeight` will be 0.
			 *
			 * When a user changes thread params, on the first pass of this logic,
			 * the anchor post may not move (if there are no parents above it), or it
			 * may have gone off the screen above, because of the sudden lack of
			 * parents due to `deferParents === true`. This negative value (minus
			 * `headerHeight`) will result in a _negative_ `offset` value, which will
			 * scroll the anchor post _down_ to the top of the screen.
			 *
			 * However, `prepareForParamsUpdate` also resets scroll to `0`, so when a user
			 * changes params, the anchor post's offset will actually be equivalent
			 * to the `headerHeight` because of how the DOM is stacked on web.
			 * Therefore, `anchorOffsetTop - headerHeight` will once again be 0,
			 * which means the first pass in this case will result in no scroll.
			 *
			 * Then, once parents are prepended, this will fire again. Now, the
			 * `anchorOffsetTop` will be positive, which minus the header height,
			 * will give us a _positive_ offset, which will scroll the anchor post
			 * back _up_ to the top of the screen.
			 */
			const offset = anchorOffsetTop - headerHeight;
			list.scrollToOffset({ animated: false, offset });

			/*
			 * After we manage to do a positive adjustment, we need to ensure this
			 * doesn't run again until scroll handling is requested again via
			 * `shouldHandleScroll.current === true` and a params change via
			 * `prepareForParamsUpdate`.
			 *
			 * The `isRoot` here is needed because if we're looking at the anchor
			 * post, this handler will not fire after `deferParents` is set to
			 * `false`, since there are no parents to render above it. In this case,
			 * we want to make sure `shouldHandleScroll` is set to `false` right away
			 * so that subsequent size changes unrelated to a params change (like
			 * pagination) do not affect scroll.
			 */
			if (offset > 0 || isRoot) shouldHandleScroll.current = false;
		}
	};

	/** prepares the UI to maintain the scroll position at the anchor post when thread parameters change. */
	const prepareForParamsUpdate = () => {
		/**
		 * Truncate list so that anchor post is the first item in the list. Manual scroll handling is predicated
		 * on this.
		 */
		setDeferParents(true);
		// reset this to a lower value for faster re-render
		setMaxChildrenCount(CHILDREN_CHUNK_SIZE);
		// set flag
		shouldHandleScroll.current = true;
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
		if (thread.state.isFetching) return;
		// can be true after `prepareForParamsUpdate` is called
		if (deferParents) return;
		// prevent any state mutations if we know we're done
		if (maxParentCount >= totalParents) return;
		setMaxParentCount((n) => n + PARENT_CHUNK_SIZE);
	};

	const onEndReached = () => {
		if (thread.state.isFetching) return;
		// can be true after `prepareForParamsUpdate` is called
		if (deferParents) return;
		// prevent any state mutations if we know we're done
		if (maxChildrenCount >= totalChildren) return;
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
				if (item.type === 'readMoreUp' || (hasDepth && item.depth < 0)) continue;
				// can exit early if we've reached the max children count
				if (childrenCount > maxChildrenCount) break;

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
					disableSkipOffscreen={keepAnchorRegionRendered}
					onContentSizeChange={onContentSizeChangeWebOnly}
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

/**
 * keeps the anchor post (depth 0) and its direct parent (depth -1) from skipping rendering when off-screen to
 * prevent layout shifts when the anchor-pinning scroll brings them into view
 */
const keepAnchorRegionRendered = (item: ThreadItem) =>
	'depth' in item && (item.depth === 0 || item.depth === -1);
