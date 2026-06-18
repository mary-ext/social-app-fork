import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, type ScrollViewProps, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppBskyEmbedRecord, ChatBskyConvoDefs, ChatBskyEmbedJoinLink } from '@atcute/bluesky';
import { tokenize } from '@atcute/bluesky-richtext-parser';
import { ok } from '@atcute/client';
import type { $type, Handle } from '@atcute/lexicons';

import {
	runOnJS,
	type ScrollEvent,
	type SharedValue,
	useAnimatedRef,
	useDerivedValue,
	useSharedValue,
} from '#/lib/animations/reanimatedCompat';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { mergeRefs } from '#/lib/merge-refs';
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
import { MessageItem } from '#/components/dms/MessageItem';
import { MessageOverlays } from '#/components/dms/MessageOverlays';
import { MessageRepliesProvider } from '#/components/dms/MessageReplies';
import { NewMessagesPill } from '#/components/dms/NewMessagesPill';
import { SystemMessageGroup } from '#/components/dms/SystemMessageGroup';
import { SystemMessageItem } from '#/components/dms/SystemMessageItem';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';

import { useScrollEdgeEffectRef } from '#/shims/bsky-scroll-edge-effect';
import {
	KeyboardChatScrollView,
	type KeyboardChatScrollViewProps,
	KeyboardGestureArea,
} from '#/shims/native-keyboard-controller';

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
			{isLoading && <Loader size="xl" />}
		</View>
	);
}

function keyExtractor(item: RenderItem) {
	return item.key;
}

function getNeighborMessage(
	items: RenderItem[],
	index: number,
): ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView | null {
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

	const textInputId = 'chat-input-' + useId();
	const flatListRef = useAnimatedRef<ListMethods>();

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

	const inputHeightUI = useSharedValue(0);
	const [inputHeightJS, setInputHeightJS] = useState(0);

	const onInputLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const inputHeight = event.nativeEvent.layout.height;
			inputHeightUI.set(inputHeight);
			setInputHeightJS(inputHeight);
		},
		[inputHeightUI],
	);

	// We need to keep track of when the scroll offset is at the bottom of the list to know when to scroll as new items
	// are added to the list. For example, if the user is scrolled up to 1iew older messages, we don't want to scroll to
	// the bottom.
	const isAtBottom = useSharedValue(true);

	// This will be used on web to assist in determining if we need to maintain the content offset
	const isAtTop = useSharedValue(true);

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
	const layoutHeight = useSharedValue(0);
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
	const onContentSizeChange = useCallback(
		(_: number, height: number) => {
			// Because web does not have `maintainVisibleContentPosition` support, we will need to manually scroll to the
			// previous off whenever we add new content to the previous offset whenever we add new content to the list.
			if (isAtTop.get() && hasScrolled) {
				flatListRef.current?.scrollToOffset({
					offset: height - prevContentHeight.current,
					animated: false,
				});
			}

			// Initial scroll to bottom — unconditional, not gated on isAtBottom. This is separated because contentInset
			// can cause an early onScroll with a negative offset that sets isAtBottom to false before we get here.
			// Empty convos take this path too (once history is done) so hasScrolled gets set without an animated scroll.
			if (!hasInitiallyScrolled.current && (renderItems.length > 0 || !convoState.isFetchingHistory)) {
				hasInitiallyScrolled.current = true;
				flatListRef.current?.scrollToOffset({ offset: height, animated: false });
				// If history is already done loading, mark ready after a frame for the scroll to settle.
				// Otherwise, the footer sentinel's onLayout will handle it when history finishes.
				if (!convoState.isFetchingHistory) {
					requestAnimationFrame(() => {
						setHasScrolled(true);
					});
				}
				prevContentHeight.current = height;
				prevItemCount.current = renderItems.length;
				return;
			}

			// Subsequent: auto-scroll only if user is at the bottom
			if (isAtBottom.get()) {
				// If the size of the content is changing by more than the height of the screen, then we don't
				// want to scroll further than the start of all the new content. Since we are storing the previous offset,
				// we can just scroll the user to that offset and add a little bit of padding. We'll also show the pill
				// that can be pressed to immediately scroll to the end.
				if (
					didBackground.current &&
					hasScrolled &&
					height - prevContentHeight.current > layoutHeight.get() - 50 &&
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
		},
		[
			hasScrolled,
			setHasScrolled,
			convoState.isFetchingHistory,
			renderItems.length,
			// these are stable
			flatListRef,
			isAtTop,
			isAtBottom,
			layoutHeight,
		],
	);

	const onStartReached = useCallback(() => {
		void convoState.fetchMessageHistory();
	}, [convoState]);

	const onScroll = useCallback(
		(e: ScrollEvent) => {
			'worklet';
			layoutHeight.set(e.layoutMeasurement.height);
			const bottomOffset = e.contentOffset.y + e.layoutMeasurement.height;

			// Most apps have a little bit of space the user can scroll past while still automatically scrolling ot the bottom
			// when a new message is added, hence the 100 pixel offset
			isAtBottom.set(e.contentSize.height - 100 < bottomOffset);
			isAtTop.set(e.contentOffset.y <= 1);

			if (
				newMessagesPill.show &&
				(e.contentOffset.y > newMessagesPill.startContentOffset + 200 || isAtBottom.get())
			) {
				runOnJS(setNewMessagesPill)({
					show: false,
					startContentOffset: 0,
				});
			}
		},
		[layoutHeight, newMessagesPill, isAtBottom, isAtTop],
	);

	// -- Keyboard animation handling

	const { bottom: bottomInset } = useSafeAreaInsets();

	// -- Message sending
	const onSendMessage = useCallback(
		async (text: string, reply?: $type.enforce<ChatBskyConvoDefs.MessageView>) => {
			let trimmedText = cleanNewlines(text.trimEnd());

			let embed:
				| $type.enforce<AppBskyEmbedRecord.Main>
				| $type.enforce<ChatBskyEmbedJoinLink.Main>
				| undefined;
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
		},
		[appview, convoState, messageEmbed, getPost, getJoinLinkPreview, hasSession, hasScrolled, setHasScrolled],
	);

	const scrollToEndOnPress = useCallback(() => {
		flatListRef.current?.scrollToOffset({
			offset: prevContentHeight.current,
			animated: true,
		});
	}, [flatListRef]);

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

	// Footer sentinel: when history is still loading during the initial scroll, the footer's onLayout fires each time
	// new items are prepended (shifting its position). Once history finishes, this triggers setHasScrolled.
	const onFooterLayout = useCallback(() => {
		if (hasInitiallyScrolled.current && !hasScrolled && !convoState.isFetchingHistory) {
			requestAnimationFrame(() => {
				setHasScrolled(true);
			});
		}
	}, [hasScrolled, setHasScrolled, convoState.isFetchingHistory]);

	const renderScrollComponent = useCallback(
		(props: ScrollViewProps) => <ChatScrollComponent {...props} inputHeight={inputHeightUI} />,
		[inputHeightUI],
	);

	return (
		<InviteLinkDialogProvider convo={convoState.convo}>
			<MessageRepliesProvider scrollToMessage={scrollToMessage}>
				<MessageOverlays>
					<KeyboardGestureArea
						interpolator="ios"
						// HACKFIX: upstream keyboard controller issue #1419
						offset={Math.round(inputHeightJS)}
						// slightly too buggy unfortunately, enable when possible
						// textInputNativeID={textInputId}
						style={[a.flex_1]}
					>
						{/* Custom scroll provider so that we can use the `onScroll` event in our custom List implementation */}
						<View
							style={[
								a.flex_1,
								{ opacity: hasScrolled ? 1 : 0 },
								webViewStyle({ transition: 'opacity 0.2s ease-in-out' }),
							]}
						>
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
									// native only (prop is not supported on web)
									renderScrollComponent={renderScrollComponent}
									contentContainerStyle={{
										paddingBottom: 0,
									}}
									ListFooterComponent={
										<View style={{ height: tokens.space.md + inputHeightJS }} onLayout={onFooterLayout} />
									}
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
						</View>
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
											textInputId={textInputId}
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
					</KeyboardGestureArea>
					{newMessagesPill.show && <NewMessagesPill onPress={scrollToEndOnPress} />}
				</MessageOverlays>
			</MessageRepliesProvider>
		</InviteLinkDialogProvider>
	);
}

/** Note: native only */
function ChatScrollComponent({
	ref,
	inputHeight,
	...props
}: ScrollViewProps & {
	ref?: React.RefObject<KeyboardChatScrollViewProps>;
	inputHeight: SharedValue<number>;
}) {
	const scrollEdgeRef = useScrollEdgeEffectRef();
	useSafeAreaInsets();

	const offset = 0;

	const inputOffset = 0;

	const extraContentPadding = useDerivedValue(() => inputHeight.get() + inputOffset);

	return (
		<KeyboardChatScrollView
			ref={mergeRefs([scrollEdgeRef, ref])}
			automaticallyAdjustContentInsets={false}
			keyboardDismissMode="interactive"
			keyboardLiftBehavior="always"
			extraContentPadding={extraContentPadding}
			offset={offset}
			{...props}
		/>
	);
}

type FooterState = 'loading' | 'new-chat' | 'request' | 'standard';

function getFooterState(convoState: ActiveConvoStates, hasAcceptOverride?: boolean): FooterState {
	if (convoState.items.length === 0) {
		if (convoState.isFetchingHistory) {
			return 'loading';
		} else {
			return 'new-chat';
		}
	}

	if (convoState.convo.view.status === 'request' && !hasAcceptOverride) {
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
