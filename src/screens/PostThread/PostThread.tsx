import { startTransition, useEffect, useRef, useState } from 'react';

import type { ResourceUri } from '@atcute/lexicons';

import { clsx } from 'clsx';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { useFeedFeedback } from '#/state/feed-feedback';
import { usePostSource } from '#/state/post-source';
import type { ThreadViewOption } from '#/state/queries/preferences/useThreadPreferences';
import { PostThreadContextProvider, type ThreadItem, usePostThread } from '#/state/queries/usePostThread';
import { useSession } from '#/state/session';

import { useOpenComposer, type OnPostSuccessData } from '#/features/composer/open-composer';

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
import * as css from '#/screens/PostThread/PostThread.css';

import { List, type ListMethods } from '#/components/List/List';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useFocusEffect } from '#/router';

/** Height the trailing spacer falls back to when the thread has no parents. */
const FALLBACK_FOOTER_HEIGHT = 180;

// Measured threads skew toward short text replies (~110px), punctuated by a tall anchor and occasional media.
const ITEM_HEIGHT_ESTIMATE = 200;

export function PostThread({ uri }: { uri: ResourceUri }) {
	const { gtMobile } = useBreakpoints();
	const { hasSession } = useSession();
	const headerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<ListMethods>(null);
	const needsInitialAnchor = useRef(true);
	const anchorPostSource = usePostSource();
	const feedFeedback = useFeedFeedback(anchorPostSource?.feed, hasSession);

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
				feedContext: anchorPostSource.feedContext,
				reqId: anchorPostSource.reqId,
			});
		}
	});

	const canReply = !anchor?.value.post?.viewer?.replyDisabled;

	// hide parents until the anchor paints to avoid flashing the thread top before scrolling.
	const [deferParents, setDeferParents] = useState(true);

	// a view/sort change releases parents synchronously here; the initial mount uses the scroll-before-prepend
	// pass in the effect below instead, so this stays disarmed for it.
	const releaseParentsOnAnchorMount = useRef(false);
	const setAnchorNode = (node: HTMLDivElement | null) => {
		if (node && releaseParentsOnAnchorMount.current) {
			releaseParentsOnAnchorMount.current = false;
			setDeferParents(false);
		}
	};

	/** prepares the UI to maintain the scroll position at the anchor post when thread parameters change. */
	const prepareForParamsUpdate = () => {
		needsInitialAnchor.current = true;
		releaseParentsOnAnchorMount.current = true;

		// make the anchor the first item again so the virtualizer can preserve it when the new parents return.
		setDeferParents(true);
	};

	const setSortWrapped = (sort: string) => {
		prepareForParamsUpdate();
		thread.actions.setSort(sort);
	};

	const setViewWrapped = (view: ThreadViewOption) => {
		prepareForParamsUpdate();
		thread.actions.setView(view);
	};

	let slices = thread.data.items;
	if (deferParents) {
		const itemsAnchorIndex = slices.findIndex(isAnchorItem);
		if (itemsAnchorIndex > 0) {
			slices = slices.slice(itemsAnchorIndex);
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
	const anchorIndex = deferredSlices.findIndex(isAnchorItem);

	// pass 1 scrolls the anchor-only list to the anchor before parents exist, then releases them; pass 2 does
	// the final correction. pinning the viewport to the anchor first is what stops prepend anchoring from
	// preserving a child instead — screens share the window scroll, and the router restores it only after this
	// commit, so a fresh mount would otherwise anchor against the outgoing thread's stale scroll offset.
	useFocusEffect(() => {
		if (anchorIndex === -1 || !needsInitialAnchor.current) {
			return;
		}

		const animationFrame = requestAnimationFrame(() => {
			const didScroll =
				listRef.current?.scrollToIndex({
					index: anchorIndex,
					offset: headerRef.current?.getBoundingClientRect().bottom,
				}) ?? false;
			if (!didScroll) {
				return;
			}

			if (deferParents) {
				// anchor is pinned; safe to prepend parents around it now
				setDeferParents(false);
				return;
			}

			needsInitialAnchor.current = false;
		});
		return () => cancelAnimationFrame(animationFrame);
	});

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
						 * load-bearing key: remounting on any thread param change fires `setAnchorNode`, which
						 * releases withheld parents during that commit. keep new params in the key. nested so the
						 * virtualizer row keeps its stable uri key.
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
			return <ThreadItemPostTombstone type="notFound" />;
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
				<Layout.Header.EndSlot>
					<HeaderDropdown
						sort={thread.state.sort}
						setSort={setSortWrapped}
						view={thread.state.view}
						setView={setViewWrapped}
					/>
				</Layout.Header.EndSlot>
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

// blocked and not-found posts can also be the anchor.
const isAnchorItem = (item: ThreadItem) => {
	return 'depth' in item && item.depth === 0;
};
