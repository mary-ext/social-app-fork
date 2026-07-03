import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, type NativeScrollEvent, View, type ViewStyle } from 'react-native';

import type { AppBskyEmbedRecord, ChatBskyConvoDefs, ChatBskyEmbedJoinLink } from '@atcute/bluesky';
import { tokenize } from '@atcute/bluesky-richtext-parser';
import { ok } from '@atcute/client';
import type { $type, Handle } from '@atcute/lexicons';

import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { ScrollProvider } from '#/lib/ScrollContext';
import { cleanNewlines, detectFacets } from '#/lib/strings/rich-text-facets';
import { shortenLinks } from '#/lib/strings/rich-text-manip';
import {
	convertBskyAppUrlIfNeeded,
	getChatInviteCodeFromUrl,
	isBskyPostUrl,
} from '#/lib/strings/url-helpers';

import { type ActiveConvoStates, isConvoActive, useConvoActive } from '#/state/messages/convo';
import { type ConvoState, ConvoStatus } from '#/state/messages/convo/types';
import { useGetJoinLinkPreview } from '#/state/queries/join-links';
import { useGetPost } from '#/state/queries/post';
import { createEmbedViewRecordFromPost } from '#/state/queries/postgate/util';
import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { List, type ListMethods } from '#/view/com/util/List';

import { MessageComposer } from '#/screens/Messages/components/MessageComposer';
import { MessageListError } from '#/screens/Messages/components/MessageListError';

import { atoms as a, tokens, useTheme } from '#/alf';

import { DateDivider } from '#/components/dms/DateDivider';
import { MessageItem, type MessageItemNeighbor } from '#/components/dms/MessageItem';
import { MessageOverlays } from '#/components/dms/MessageOverlays';
import { MessageRepliesProvider } from '#/components/dms/MessageReplies';
import { NewMessagesPill } from '#/components/dms/NewMessagesPill';
import { SystemMessageGroup } from '#/components/dms/SystemMessageGroup';
import { SystemMessageItem } from '#/components/dms/SystemMessageItem';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

import { ChatStatusInfo } from './ChatStatusInfo';
import { groupSystemMessages, type RenderItem } from './groupSystemMessages';
import { InviteLinkDialogProvider } from './InviteLinkDialogProvider';
import { MessageInputEmbed, useMessageEmbed } from './MessageInputEmbed';
import { MessageInputReply } from './MessageInputReply';
import { MessagesListGroupInfoPanel } from './MessagesListGroupInfoPanel';
import { MessagesListInfoPanel } from './MessagesListInfoPanel';
import { KeyboardStickyView } from './vendor/KeyboardStickyView';

type WebViewStyle = ViewStyle & {
	scrollbarColor?: string;
	scrollbarGutter?: 'stable';
	scrollbarWidth?: 'thin';
	transition?: string;
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style;
};

function MaybeLoader({ isLoading }: { isLoading: boolean }) {
	return (
		<View
			style={{
				height: 50,
				width: '100%',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{isLoading && <Spinner color="default" label={m['common.status.loading']()} size="2xl" />}
		</View>
	);
}

function keyExtractor(item: RenderItem) {
	return item.key;
}

function getNeighborMessage(items: RenderItem[], index: number): MessageItemNeighbor {
	const neighbor = items[index];
	if (!neighbor) return null;
	if (
		neighbor.type === 'message' ||
		neighbor.type === 'pending-message' ||
		neighbor.type === 'deleted-message'
	) {
		if (
			neighbor.message.$type === 'chat.bsky.convo.defs#messageView' ||
			neighbor.message.$type === 'chat.bsky.convo.defs#deletedMessageView'
		) {
			return neighbor.message;
		}
	}
	return null;
}

function onScrollToIndexFailed() {
	// Placeholder function. You have to give FlatList something or else it will error.
}

export function MessagesList({
	hasScrolled,
	setHasScrolled,
	footer,
	hasAcceptOverride,
	transparentHeaderHeight,
}: {
	hasScrolled: boolean;
	setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>;
	footer?: React.ReactNode;
	hasAcceptOverride?: boolean;
	transparentHeaderHeight?: number;
}) {
	const convoState = useConvoActive();
	const { appview } = useClients();
	const { hasSession } = useSession();
	const getPost = useGetPost();
	const getJoinLinkPreview = useGetJoinLinkPreview();
	const { embed: messageEmbed, setEmbed } = useMessageEmbed();
	const t = useTheme();

	const flatListRef = useRef<ListMethods | null>(null);

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

	const renderItems = groupSystemMessages(convoState.items);

	const [newMessagesPill, setNewMessagesPill] = useState({
		show: false,
		startContentOffset: 0,
	});

	const [inputHeightJS, setInputHeightJS] = useState(0);

	const onInputLayout = (event: LayoutChangeEvent) => {
		setInputHeightJS(event.nativeEvent.layout.height);
	};

	// We need to keep track of when the scroll offset is at the bottom of the list to know when to scroll as new items
	// are added to the list. For example, if the user is scrolled up to 1iew older messages, we don't want to scroll to
	// the bottom.
	const isAtBottom = useRef(true);

	// This will be used on web to assist in determining if we need to maintain the content offset
	const isAtTop = useRef(true);

	// Used to keep track of the current content height. We'll need this in `onScroll` so we know when to start allowing
	// onStartReached to fire.
	const prevContentHeight = useRef(0);
	const prevItemCount = useRef(0);

	// Tracks whether the initial scroll-to-bottom has been triggered. Separated from isAtBottom so that contentInset
	// (which causes an early onScroll with negative offset) can't prevent the first scroll.
	// Reset when hasScrolled goes back to false (e.g. convo re-initialization after backgrounding).
	const hasInitiallyScrolled = useRef(false);
	const prevHasScrolled = useRef(hasScrolled);
	useLayoutEffect(() => {
		if (prevHasScrolled.current && !hasScrolled) {
			hasInitiallyScrolled.current = false;
		}
		prevHasScrolled.current = hasScrolled;
	}, [hasScrolled]);

	// -- Keep track of background state and positioning for new pill
	const layoutHeight = useRef(0);
	const didBackground = useRef(false);
	useEffect(() => {
		if (convoState.status === ConvoStatus.Backgrounded) {
			didBackground.current = true;
		}
	}, [convoState.status]);

	// -- Scroll handling

	// Every time the content size changes, that means one of two things is happening:
	// 1. New messages are being added from the log or from a message you have sent
	// 2. Old messages are being prepended to the top
	//
	// The first time that the content size changes is when the initial items are rendered. Because we cannot rely on
	// `initialScrollIndex`, we need to immediately scroll to the bottom of the list. That scroll will not be animated.
	//
	// Subsequent resizes will only scroll to the bottom if the user is at the bottom of the list (within 100 pixels of
	// the bottom). Therefore, any new messages that come in or are sent will result in an animated scroll to end. However
	// we will not scroll whenever new items get prepended to the top.
	const onContentSizeChange = (_: number, height: number) => {
		// Because web does not have `maintainVisibleContentPosition` support, we will need to manually scroll to the
		// previous off whenever we add new content to the previous offset whenever we add new content to the list.
		if (isAtTop.current && hasScrolled) {
			flatListRef.current?.scrollToOffset({
				offset: height - prevContentHeight.current,
				animated: false,
			});
		}

		// Initial scroll to bottom — unconditional, not gated on isAtBottom. This is separated because contentInset
		// can cause an early onScroll with a negative offset that sets isAtBottom to false before we get here.
		// Revealing the list (setHasScrolled) is handled by a separate effect, not here: this callback runs from a
		// ResizeObserver whose closure can lag behind the latest render, so the readiness it observes is unreliable.
		if (!hasInitiallyScrolled.current && (renderItems.length > 0 || !convoState.isFetchingHistory)) {
			hasInitiallyScrolled.current = true;
			flatListRef.current?.scrollToOffset({ offset: height, animated: false });
			prevContentHeight.current = height;
			prevItemCount.current = renderItems.length;
			return;
		}

		// Subsequent: auto-scroll only if user is at the bottom
		if (isAtBottom.current) {
			// If the size of the content is changing by more than the height of the screen, then we don't
			// want to scroll further than the start of all the new content. Since we are storing the previous offset,
			// we can just scroll the user to that offset and add a little bit of padding. We'll also show the pill
			// that can be pressed to immediately scroll to the end.
			if (
				didBackground.current &&
				hasScrolled &&
				height - prevContentHeight.current > layoutHeight.current - 50 &&
				renderItems.length - prevItemCount.current > 1
			) {
				flatListRef.current?.scrollToOffset({
					offset: prevContentHeight.current - 65,
					animated: true,
				});
				setNewMessagesPill({
					show: true,
					startContentOffset: prevContentHeight.current - 65,
				});
			} else {
				flatListRef.current?.scrollToOffset({
					offset: height,
					// only animate when new items were appended — pure layout growth
					// (e.g. the composer spacer getting its height on web) should
					// snap instantly rather than visibly scrolling
					animated:
						hasScrolled && height > prevContentHeight.current && renderItems.length > prevItemCount.current,
				});
			}
		}

		prevContentHeight.current = height;
		prevItemCount.current = renderItems.length;
		didBackground.current = false;
	};

	// Reveal the list once the initial history has loaded. This is deliberately driven by render state
	// rather than onContentSizeChange: that callback fires from a ResizeObserver whose closure can lag a
	// render behind, so it can observe `isFetchingHistory` as still true after the messages have arrived
	// and never flip `hasScrolled` — leaving the list hidden and inert (pointerEvents: none) forever.
	// The scroll-to-bottom itself is handled by onContentSizeChange; here we just settle and reveal.
	useEffect(() => {
		if (hasScrolled || convoState.isFetchingHistory) {
			return;
		}
		hasInitiallyScrolled.current = true;
		const raf = requestAnimationFrame(() => {
			flatListRef.current?.scrollToEnd({ animated: false });
			setHasScrolled(true);
		});
		return () => cancelAnimationFrame(raf);
	}, [convoState.isFetchingHistory, hasScrolled, setHasScrolled]);

	const onStartReached = () => {
		void convoState.fetchMessageHistory();
	};

	const onScroll = (e: NativeScrollEvent) => {
		layoutHeight.current = e.layoutMeasurement.height;
		const bottomOffset = e.contentOffset.y + e.layoutMeasurement.height;

		// Most apps have a little bit of space the user can scroll past while still automatically scrolling ot the bottom
		// when a new message is added, hence the 100 pixel offset
		isAtBottom.current = e.contentSize.height - 100 < bottomOffset;
		isAtTop.current = e.contentOffset.y <= 1;

		if (
			newMessagesPill.show &&
			(e.contentOffset.y > newMessagesPill.startContentOffset + 200 || isAtBottom.current)
		) {
			setNewMessagesPill({
				show: false,
				startContentOffset: 0,
			});
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
						const rkey = url.split('/').filter(Boolean).at(-1);
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
							params: { handle: handle as Handle },
						}),
					);
					return res.did;
				} catch {
					return undefined;
				}
			}),
		);

		if (!hasScrolled) {
			setHasScrolled(true);
		}

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
	};

	const scrollToEndOnPress = () => {
		flatListRef.current?.scrollToOffset({
			offset: prevContentHeight.current,
			animated: true,
		});
	};

	// Scroll to a message by id, if it's currently loaded in the list. Per the
	// feature scope, we don't fetch history to find unloaded messages - tapping a
	// reply to an out-of-window message is a no-op. Returns whether the message
	// was found, so the caller knows whether to flash it.
	const scrollToMessage = useNonReactiveCallback((messageId: string) => {
		const index = renderItems.findIndex(
			(item) =>
				(item.type === 'message' || item.type === 'pending-message' || item.type === 'deleted-message') &&
				item.message.id === messageId,
		);
		if (index === -1) return false;

		flatListRef.current?.scrollToIndex({ index, viewPosition: 0.3, animated: true });
		return true;
	});

	const renderItem = ({ item, index }: { item: RenderItem; index: number }) => {
		if (item.type === 'message' || item.type === 'pending-message') {
			return (
				<MessageItem
					item={item}
					isGroupChat={convoState.convo.kind === 'group'}
					prevMessage={getNeighborMessage(renderItems, index - 1)}
					nextMessage={getNeighborMessage(renderItems, index + 1)}
					relatedProfiles={convoState.relatedProfiles}
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
					<View style={[a.flex_1]}>
						{/* Custom scroll provider so that we can use the `onScroll` event in our custom List implementation */}
						<ScrollProvider onScroll={onScroll}>
							<List
								ref={flatListRef}
								data={renderItems}
								renderItem={renderItem}
								keyExtractor={keyExtractor}
								disableFullWindowScroll={true}
								disableVirtualization={true}
								// The extra two items account for the header and the footer components
								initialNumToRender={62}
								maxToRenderPerBatch={32}
								keyboardDismissMode="interactive"
								keyboardShouldPersistTaps="handled"
								maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
								removeClippedSubviews={false}
								sideBorders={false}
								onContentSizeChange={onContentSizeChange}
								onStartReached={onStartReached}
								onScrollToIndexFailed={onScrollToIndexFailed}
								showsVerticalScrollIndicator={true}
								scrollEventThrottle={100}
								ListHeaderComponent={
									<>
										<MaybeLoader isLoading={convoState.isFetchingHistory} />
										{convoState.hasAllHistory ? (
											convoState.convo?.kind === 'group' ? (
												<MessagesListGroupInfoPanel convo={convoState.convo} />
											) : convoState.convo?.kind === 'direct' ? (
												<MessagesListInfoPanel convo={convoState.convo} />
											) : null
										) : null}
									</>
								}
								contentContainerStyle={{
									paddingBottom: 0,
								}}
								ListFooterComponent={<View style={{ height: tokens.space.md + inputHeightJS }} />}
								style={webViewStyle({
									scrollbarWidth: 'thin',
									scrollbarColor: `${t.palette.contrast_100} transparent`,
									scrollbarGutter: 'stable',
								})}
								pointerEvents={hasScrolled ? 'auto' : 'none'}
								contentInset={{ top: transparentHeaderHeight }}
								scrollIndicatorInsets={{ top: transparentHeaderHeight }}
							/>
						</ScrollProvider>
						<KeyboardStickyView
							style={[a.absolute, a.bottom_0, a.left_0, a.right_0]}
							onLayout={onInputLayout}
							minimumOffset={bottomInset}
							offset={{
								closed: 0,
								opened: 0,
							}}
						>
							{footer ?? (
								<ConversationFooter convoState={convoState} hasAcceptOverride={hasAcceptOverride}>
									{({ loading }) => (
										<MessageComposer
											onSendMessage={(message, replyTo) => void onSendMessage(message, replyTo)}
											hasEmbed={!!messageEmbed}
											setEmbed={setEmbed}
											loading={loading}
										>
											<MessageInputReply />
											<MessageInputEmbed embed={messageEmbed} setEmbed={setEmbed} />
										</MessageComposer>
									)}
								</ConversationFooter>
							)}
						</KeyboardStickyView>
					</View>
					{newMessagesPill.show && <NewMessagesPill onPress={scrollToEndOnPress} />}
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
