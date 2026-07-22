import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { AppBskyEmbedRecord, ChatBskyConvoDefs, ChatBskyEmbedJoinLink } from '@atcute/bluesky';
import { tokenize } from '@atcute/bluesky-richtext-parser';
import { ok } from '@atcute/client';
import type { $type } from '@atcute/lexicons';

import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { cleanNewlines, detectFacets } from '#/lib/strings/rich-text-facets';
import { shortenLinks } from '#/lib/strings/rich-text-manip';
import {
	convertBskyAppUrlIfNeeded,
	getChatInviteCodeFromUrl,
	isBskyPostUrl,
} from '#/lib/strings/url-helpers';

import { type ActiveConvoStates, isConvoActive, useConvoActive } from '#/state/messages/convo';
import type { ConvoState } from '#/state/messages/convo/types';
import { useGetJoinLinkPreview } from '#/state/queries/join-links';
import { useGetPost } from '#/state/queries/post';
import { createEmbedViewRecordFromPost } from '#/state/queries/postgate/util';
import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { MessageComposer } from '#/screens/Messages/components/MessageComposer';
import { MessageListError } from '#/screens/Messages/components/MessageListError';

import { DateDivider } from '#/components/dms/DateDivider';
import { MessageItem } from '#/components/dms/MessageItem';
import { MessageOverlays } from '#/components/dms/MessageOverlays';
import { MessageRepliesProvider } from '#/components/dms/MessageReplies';
import { NewMessagesPill } from '#/components/dms/NewMessagesPill';
import { SystemMessageGroup } from '#/components/dms/SystemMessageGroup';
import { SystemMessageItem } from '#/components/dms/SystemMessageItem';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { space } from '#/styles/tokens.css';

import { ChatStatusInfo } from './ChatStatusInfo';
import { InviteLinkDialogProvider } from './InviteLinkDialogProvider';
import { buildMessageTimeline, type RenderItem } from './message-timeline';
import { MessageInputEmbed, useMessageEmbed } from './MessageInputEmbed';
import { MessageInputReply } from './MessageInputReply';
import * as css from './MessagesList.css';
import { MessagesListGroupInfoPanel } from './MessagesListGroupInfoPanel';
import { MessagesListInfoPanel } from './MessagesListInfoPanel';

// bottom is scrollTop 0 in the column-reverse scroller; treat anything within this many pixels of it
// as "at bottom" for the new-messages pill.
const NEAR_BOTTOM_PX = 100;
// how far ahead of the top edge (in viewport heights) to begin loading older history.
const HISTORY_LOOKAHEAD = '200% 0px 0px 0px';

function MaybeLoader({ isLoading }: { isLoading: boolean }) {
	return (
		<div className={css.loader}>
			{isLoading && <Spinner color="default" label={m['common.status.loading']()} size="2xl" />}
		</div>
	);
}

/**
 * a zero-height marker that reports when it enters or leaves the scroll viewport, used to drive history
 * loading (top) and at-bottom detection (bottom) without reading scroll offsets.
 */
function IntersectionSentinel({
	onChange,
	root,
	rootMargin,
}: {
	onChange: (isIntersecting: boolean) => void;
	root: React.RefObject<HTMLElement | null>;
	rootMargin?: string;
}) {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const stableOnChange = useNonReactiveCallback(onChange);

	useEffect(() => {
		const node = nodeRef.current;
		if (!node) {
			return;
		}
		const observer = new IntersectionObserver((entries) => stableOnChange(entries[0]!.isIntersecting), {
			root: root.current ?? null,
			rootMargin: rootMargin ?? '0px',
		});
		observer.observe(node);
		return () => observer.disconnect();
	}, [root, rootMargin, stableOnChange]);

	return <div ref={nodeRef} />;
}

function getLastMessageKey(items: RenderItem[]): string | undefined {
	for (let i = items.length - 1; i >= 0; i--) {
		const item = items[i]!;
		if (item.type === 'message' || item.type === 'pending-message') {
			return item.key;
		}
	}
	return undefined;
}

export function MessagesList({
	footer,
	hasAcceptOverride,
}: {
	footer?: React.ReactNode;
	hasAcceptOverride?: boolean;
}) {
	const convoState = useConvoActive();
	const { appview } = useClients();
	const { hasSession } = useSession();
	const getPost = useGetPost();
	const getJoinLinkPreview = useGetJoinLinkPreview();
	const { embed: messageEmbed, setEmbed } = useMessageEmbed();

	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
	const onToggleGroup = (key: string) => {
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	const renderItems = useMemo(
		() => buildMessageTimeline(convoState.items, convoState.relatedProfiles),
		[convoState.items, convoState.relatedProfiles],
	);

	const [showPill, setShowPill] = useState(false);

	// the composer floats over the bottom of the list; measure it to reserve trailing space so the
	// newest message clears it.
	const [inputHeightJS, setInputHeightJS] = useState(0);
	const inputObserver = useRef<ResizeObserver | null>(null);
	const inputRef = (node: HTMLDivElement | null) => {
		inputObserver.current?.disconnect();
		if (node) {
			const observer = new ResizeObserver(() => setInputHeightJS(node.offsetHeight));
			observer.observe(node);
			inputObserver.current = observer;
			setInputHeightJS(node.offsetHeight);
		}
	};

	// The column-reverse scroller pins to the bottom (scrollTop 0) on its own, so we only track whether
	// the user is near the bottom (to keep the pill in sync) and back up the scroll offset across
	// history prepends in case the browser drops its anchoring.
	const isAtBottom = useRef(true);
	const prevScrollTop = useRef(0);
	const prevOldestKey = useRef<string | undefined>(undefined);
	const prevLastKey = useRef<string | undefined>(undefined);

	const scrollToBottom = (animated: boolean) => {
		scrollContainerRef.current?.scrollTo({ top: 0, behavior: animated ? 'smooth' : 'instant' });
	};

	// Restore the saved offset after older history is prepended, as a backstop to the browser's own
	// scroll anchoring (which the column-reverse scroller usually preserves on its own).
	useLayoutEffect(() => {
		const el = scrollContainerRef.current;
		if (!el) {
			return;
		}
		const oldestKey = renderItems[0]?.key;
		if (prevOldestKey.current !== undefined && oldestKey !== prevOldestKey.current && !isAtBottom.current) {
			el.scrollTop = prevScrollTop.current;
		}
		prevOldestKey.current = oldestKey;
	}, [renderItems]);

	// When a newer message arrives while the user is away from the bottom, surface the pill instead of
	// yanking them down (the column-reverse scroller leaves their position untouched on its own).
	useEffect(() => {
		const lastKey = getLastMessageKey(renderItems);
		const isNewMessage = prevLastKey.current !== undefined && lastKey !== prevLastKey.current;
		prevLastKey.current = lastKey;
		if (!isNewMessage || (isAtBottom.current && document.hasFocus())) {
			return;
		}
		setShowPill(true);
		// If we're pinned at the bottom but unfocused, nudge off zero so further messages don't drag the
		// view down while the user is away.
		const el = scrollContainerRef.current;
		if (el && el.scrollTop === 0) {
			el.scrollTop = -1;
		}
	}, [renderItems]);

	const onScroll = () => {
		const el = scrollContainerRef.current;
		if (el) {
			prevScrollTop.current = el.scrollTop;
		}
	};

	const onAtBottomChange = (atBottom: boolean) => {
		isAtBottom.current = atBottom;
		if (atBottom) {
			setShowPill(false);
		}
	};

	const onTopSentinel = (isIntersecting: boolean) => {
		if (isIntersecting && !convoState.isFetchingHistory && !convoState.hasAllHistory) {
			void convoState.fetchMessageHistory();
		}
	};

	// -- Keyboard animation handling
	const { bottom: bottomInset } = useSafeAreaInsets();

	// -- Message sending
	const onSendMessage = async (text: string, reply?: $type.enforce<ChatBskyConvoDefs.MessageView>) => {
		let trimmedText = cleanNewlines(text.trimEnd());

		let embed: $type.enforce<AppBskyEmbedRecord.Main> | $type.enforce<ChatBskyEmbedJoinLink.Main> | undefined;
		let embedView:
			| $type.enforce<AppBskyEmbedRecord.View>
			| $type.enforce<ChatBskyEmbedJoinLink.View>
			| undefined;

		if (messageEmbed?.type === 'post') {
			try {
				const post = await getPost({ uri: messageEmbed.uri });
				if (post) {
					embed = {
						$type: 'app.bsky.embed.record',
						record: {
							uri: post.uri,
							cid: post.cid,
						},
					};

					embedView = {
						$type: 'app.bsky.embed.record#view',
						record: createEmbedViewRecordFromPost(post),
					};

					// If the embedded post's own link sits at the start or end of the message text,
					// strip it — it shows as the quote embed instead.
					for (const token of tokenize(trimmedText)) {
						if (token.type !== 'autolink' || !isBskyPostUrl(token.url)) {
							continue;
						}
						const url = convertBskyAppUrlIfNeeded(token.url);
						// this might have a handle instead of a DID, so just compare the rkey
						const rkey = url.split('/').findLast(Boolean);
						if (rkey && post.uri.endsWith(rkey)) {
							if (trimmedText.startsWith(token.raw)) {
								trimmedText = cleanNewlines(trimmedText.slice(token.raw.length).trim());
							} else if (trimmedText.endsWith(token.raw)) {
								trimmedText = cleanNewlines(trimmedText.slice(0, -token.raw.length).trim());
							}
							break;
						}
					}
				}
			} catch (error) {
				logger.error('Failed to get post as quote for DM', { error });
			}
		} else if (messageEmbed?.type === 'invite') {
			const code = messageEmbed.code;
			embed = {
				$type: 'chat.bsky.embed.joinLink',
				code,
			};

			const joinLinkPreview = await getJoinLinkPreview({ code, hasSession });
			if (joinLinkPreview) {
				embedView = {
					$type: 'chat.bsky.embed.joinLink#view',
					joinLinkPreview,
				};
			}

			// If the invite link sits at the start or end of the message text, strip it — it shows as the
			// invite card instead.
			for (const token of tokenize(trimmedText)) {
				if (token.type !== 'autolink' || getChatInviteCodeFromUrl(token.url) !== code) {
					continue;
				}
				if (trimmedText.startsWith(token.raw)) {
					trimmedText = cleanNewlines(trimmedText.slice(token.raw.length).trim());
				} else if (trimmedText.endsWith(token.raw)) {
					trimmedText = cleanNewlines(trimmedText.slice(0, -token.raw.length).trim());
				}
				break;
			}
		}

		// `detectFacets` only emits mention facets for handles that resolve, so there are no
		// invalid mentions left to strip.
		const rt = shortenLinks(
			await detectFacets(trimmedText, async (handle) => {
				try {
					const res = await ok(
						appview.get('com.atproto.identity.resolveHandle', {
							params: { handle },
						}),
					);
					return res.did;
				} catch {
					return undefined;
				}
			}),
		);

		convoState.sendMessage(
			{
				text: rt.text,
				facets: rt.facets,
				embed: embed,
				replyTo: reply ? { messageId: reply.id } : undefined,
			},
			embedView,
			reply,
		);

		// Jump to the bottom so the sender sees their own message even if they were scrolled up.
		scrollToBottom(false);
	};

	const scrollToEndOnPress = () => {
		setShowPill(false);
		scrollToBottom(true);
	};

	// Scroll to a message by id, if it's currently loaded in the list. Per the
	// feature scope, we don't fetch history to find unloaded messages - tapping a
	// reply to an out-of-window message is a no-op. Returns whether the message
	// was found, so the caller knows whether to flash it. The list is not
	// virtualized, so every loaded message is in the DOM and can be located by its
	// `data-message-id` anchor.
	const scrollToMessage = useNonReactiveCallback((messageId: string) => {
		const node = scrollContainerRef.current?.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
		if (!node) {
			return false;
		}

		node.scrollIntoView({ block: 'center', behavior: 'smooth' });
		return true;
	});

	const renderItem = (item: RenderItem): React.ReactNode => {
		if (item.type === 'message' || item.type === 'pending-message') {
			return (
				<MessageItem
					hasLargeGapFromPrev={item.hasLargeGapFromPrev}
					isFirstInCluster={item.isFirstInCluster}
					isGroupChat={convoState.convo.kind === 'group'}
					isLastInCluster={item.isLastInCluster}
					item={item.convoItem}
					relatedProfiles={convoState.relatedProfiles}
					squaredBottomCorner={item.squaredBottomCorner}
					squaredTopCorner={item.squaredTopCorner}
				/>
			);
		} else if (item.type === 'deleted-message') {
			return <Text>Deleted message</Text>;
		} else if (item.type === 'system-message') {
			return <SystemMessageItem item={item} relatedProfiles={convoState.relatedProfiles} />;
		} else if (item.type === 'system-message-group') {
			return (
				<SystemMessageGroup
					item={item}
					expanded={expandedGroups.has(item.key)}
					onToggle={onToggleGroup}
					relatedProfiles={convoState.relatedProfiles}
				/>
			);
		} else if (item.type === 'system-message-date-divider') {
			return <DateDivider date={item.sentAt} />;
		} else if (item.type === 'error') {
			return <MessageListError item={item} />;
		}

		return null;
	};

	return (
		<InviteLinkDialogProvider convo={convoState.convo}>
			<MessageRepliesProvider scrollToMessage={scrollToMessage}>
				<MessageOverlays>
					<div className={css.root}>
						<div className={css.scroller} onScroll={onScroll} ref={scrollContainerRef}>
							<div className={css.timeline}>
								{!convoState.hasAllHistory ? (
									// re-key on item count so the observer re-arms after each page: an already-visible
									// sentinel that never leaves the viewport wouldn't fire a fresh intersection otherwise.
									<IntersectionSentinel
										key={renderItems.length}
										onChange={onTopSentinel}
										root={scrollContainerRef}
										rootMargin={HISTORY_LOOKAHEAD}
									/>
								) : null}
								<MaybeLoader isLoading={convoState.isFetchingHistory} />
								{convoState.hasAllHistory ? (
									convoState.convo?.kind === 'group' ? (
										<MessagesListGroupInfoPanel convo={convoState.convo} />
									) : convoState.convo?.kind === 'direct' ? (
										<MessagesListInfoPanel convo={convoState.convo} />
									) : null
								) : null}
								{renderItems.map((item) => (
									<Fragment key={item.key}>{renderItem(item)}</Fragment>
								))}
								{/* trailing space so the newest message clears the floating composer */}
								<div style={{ height: space.md + inputHeightJS }} />
								<IntersectionSentinel
									onChange={onAtBottomChange}
									root={scrollContainerRef}
									rootMargin={`0px 0px ${NEAR_BOTTOM_PX}px 0px`}
								/>
							</div>
						</div>
						<div
							className={css.inputWrap}
							ref={inputRef}
							style={bottomInset > 0 ? { transform: `translateY(${-bottomInset}px)` } : undefined}
						>
							{footer ?? (
								<ConversationFooter convoState={convoState} hasAcceptOverride={hasAcceptOverride}>
									{({ loading }) => (
										<MessageComposer
											hasEmbed={!!messageEmbed}
											loading={loading}
											onSendMessage={(message, replyTo) => void onSendMessage(message, replyTo)}
											setEmbed={setEmbed}
										>
											<MessageInputReply />
											<MessageInputEmbed embed={messageEmbed} setEmbed={setEmbed} />
										</MessageComposer>
									)}
								</ConversationFooter>
							)}
						</div>
						{showPill && <NewMessagesPill onPress={scrollToEndOnPress} />}
					</div>
				</MessageOverlays>
			</MessageRepliesProvider>
		</InviteLinkDialogProvider>
	);
}

type FooterState = 'loading' | 'new-chat' | 'request' | 'standard';

function getFooterState(convoState: ActiveConvoStates, hasAcceptOverride?: boolean): FooterState {
	const isRequest = convoState.convo.view.status === 'request' && !hasAcceptOverride;

	// For group chats, the request footer is driven purely off status: the owner
	// is always 'accepted' so never sees it, while members the owner added are
	// 'request' until they accept. This holds even before any messages load.
	if (convoState.convo.kind === 'group' && isRequest) {
		return 'request';
	}

	if (convoState.items.length === 0) {
		if (convoState.isFetchingHistory) {
			return 'loading';
		} else {
			return 'new-chat';
		}
	}

	// For direct chats, only show the request footer once there's a message. The
	// viewer's status stays 'request' until they send their first message, so an
	// empty direct request is one the viewer started themselves (show the
	// composer), whereas any message present must be an incoming one from the
	// other user (show the accept/reject footer).
	if (isRequest) {
		return 'request';
	}

	return 'standard';
}

function ConversationFooter({
	convoState,
	hasAcceptOverride,
	children,
}: {
	convoState: ConvoState;
	hasAcceptOverride?: boolean;
	children?: ((props: { loading?: boolean }) => React.ReactNode) | React.ReactNode;
}) {
	if (!isConvoActive(convoState)) {
		return null;
	}

	const footerState = getFooterState(convoState, hasAcceptOverride);
	const renderChildren = (loading?: boolean) =>
		typeof children === 'function' ? children({ loading }) : children;

	switch (footerState) {
		case 'loading':
			return renderChildren(true);
		case 'new-chat':
			return renderChildren();
		case 'request':
			return <ChatStatusInfo convoState={convoState} />;
		case 'standard':
			return renderChildren();
	}
}
