import { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, type ViewStyle } from 'react-native';

import type { ChatBskyActorGetStatus, ChatBskyConvoDefs } from '@atcute/bluesky';

import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppState } from '#/lib/appState';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import type { MessagesTabNavigatorParams, NavigationProp } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { softReset } from '#/state/events';
import { MESSAGE_SCREEN_POLL_INTERVAL } from '#/state/messages/convo/const';
import { useMessagesEventBus } from '#/state/messages/events';
import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';
import { useUnreadCountsQuery } from '#/state/queries/messages/get-unread-counts';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';
import { useUpdateAllRead } from '#/state/queries/messages/update-all-read';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';
import { FAB } from '#/view/com/util/fab/FAB';
import { List, type ListMethods } from '#/view/com/util/List';
import { ChatListLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { NewChatDialog } from '#/components/dms/dialogs/NewChatDialog';
import { useRefreshOnFocus } from '#/components/hooks/useRefreshOnFocus';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { BubbleSmile_Stroke2_Corner2_Rounded_Large as BubbleSmileIcon } from '#/components/icons/Bubble';
import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon } from '#/components/icons/CircleCheck';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Inbox_Stroke2_Corner2_Rounded_Large as InboxLargeIcon } from '#/components/icons/Inbox';
import {
	MessagePlus_Stroke2_Corner0_Rounded as MessagePlusIcon,
	MessagePlus_Stroke2_Corner0_Rounded as NewChatIcon,
} from '#/components/icons/Message';
import { SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon } from '#/components/icons/SettingsGear2';
import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';
import * as Menu from '#/components/Menu';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { Button as WebButton, ButtonIcon as WebButtonIcon } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ChatList.css';
import { ChatDisabled } from './components/ChatDisabled';
import { ChatListItem } from './components/ChatListItem';
import { InboxRequests } from './components/InboxRequests';
import { useIsWithinSplitView } from './components/splitView/context';
import { splitViewLeftScroll } from './components/splitView/leftColumnScroll';

type WebScrollStyle = Omit<ViewStyle, 'scrollbarColor' | 'scrollbarWidth'> & {
	scrollbarColor?: string;
	scrollbarWidth?: 'thin';
};

type ListItem = {
	type: 'CONVERSATION';
	conversation: ChatBskyConvoDefs.ConvoView;
	selected: boolean;
};

type ChatStatus = ChatBskyActorGetStatus.$output;

function renderItem({ item }: { item: ListItem }) {
	return <ChatListItem convo={item.conversation} selected={item.selected} />;
}

function keyExtractor(item: ListItem) {
	return item.conversation.id;
}

type Props = NativeStackScreenProps<MessagesTabNavigatorParams, 'Messages'>;

export function MessagesScreen(props: Props) {
	return <MessagesScreenInner {...props} />;
}

export function MessagesScreenInner({ route }: Props) {
	const { isWithinSplitView } = useIsWithinSplitView();
	const navigation = useNavigation<NavigationProp>();
	const t = useTheme();
	const newChatHandle = Dialog.useDialogHandle();
	const { data: chatStatus } = useChatActorStatusQuery();
	const pushToConversation = route.params?.pushToConversation;

	// Whenever we have `pushToConversation` set, it means we pressed a notification for a chat without being on
	// this tab. We should immediately push to the conversation after pressing the notification.
	// After we push, reset with `setParams` so that this effect will fire next time we press a notification, even if
	// the conversation is the same as before
	useEffect(() => {
		if (pushToConversation) {
			navigation.navigate('MessagesConversation', {
				conversation: pushToConversation,
			});
			navigation.setParams({ pushToConversation: undefined });
		}
	}, [navigation, pushToConversation]);

	// Request the poll interval to be 10s (or whatever the MESSAGE_SCREEN_POLL_INTERVAL is set to in the future)
	// but only when the screen is active
	const messagesBus = useMessagesEventBus();
	const state = useAppState();
	const isActive = state === 'active';
	useFocusEffect(
		useCallback(() => {
			if (isActive) {
				const unsub = messagesBus.requestPollInterval(MESSAGE_SCREEN_POLL_INTERVAL);
				return () => unsub();
			}
		}, [messagesBus, isActive]),
	);

	const onNewChat = (conversation: string) => navigation.navigate('MessagesConversation', { conversation });

	if (isWithinSplitView) {
		return (
			<>
				<EmptyState
					message={m['screens.messages.conversation.sayHi']()}
					icon={BubbleSmileIcon}
					messageColor="text"
					iconColor={t.atoms.text.color}
					iconSize="4xl"
					button={
						chatStatus?.chatDisabled
							? undefined
							: {
									label: m['common.chat.action.new'](),
									text: m['common.chat.action.new'](),
									onPress: () => newChatHandle.open(null),
									size: 'small',
									color: 'primary',
									icon: MessagePlusIcon,
								}
					}
					className={css.empty}
				/>
				<NewChatDialog handle={newChatHandle} onNewChat={onNewChat} />
			</>
		);
	}

	return (
		<Layout.Screen testID="messagesScreen">
			<Header newChatHandle={newChatHandle} chatStatus={chatStatus} />
			<ChatList newChatHandle={newChatHandle} chatStatus={chatStatus} />
			{!chatStatus?.chatDisabled && (
				<Dialog.Trigger
					handle={newChatHandle}
					render={
						<FAB icon={<NewChatIcon size="xl" fill={colors.white} />} label={m['common.chat.action.new']()} />
					}
				/>
			)}
			<NewChatDialog handle={newChatHandle} onNewChat={onNewChat} />
		</Layout.Screen>
	);
}

export function ChatList({
	selectedChat,
	newChatHandle,
	chatStatus,
}: {
	selectedChat?: string;
	newChatHandle: Dialog.DialogHandle;
	chatStatus: ChatStatus | undefined;
}) {
	const t = useTheme();
	const scrollElRef = useRef<ListMethods | null>(null);
	const { isWithinSplitView } = useIsWithinSplitView();

	const openChatControl = useCallback(() => {
		newChatHandle.open(null);
	}, [newChatHandle]);

	const wrappedOpenChatControl = openChatControl;

	const initialNumToRender = useInitialNumToRender({ minItemHeight: 80 });
	const [isPTRing, setIsPTRing] = useState(false);

	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } =
		useListConvosQuery({ status: 'accepted' });

	const { refetch: refetchInbox } = useListConvosQuery({
		status: 'request',
	});

	useRefreshOnFocus(refetch);
	useRefreshOnFocus(refetchInbox);

	const conversations = useMemo(() => {
		if (data?.pages) {
			const conversations = data.pages.flatMap((page) => page.convos);

			return conversations.map(
				(convo) =>
					({
						type: 'CONVERSATION',
						conversation: convo,
						selected: convo.id === selectedChat,
					}) as const,
			) satisfies ListItem[];
		}
		return [];
	}, [data, selectedChat]);

	const onRefresh = useCallback(async () => {
		setIsPTRing(true);
		try {
			await Promise.all([refetch(), refetchInbox()]);
		} catch (err) {
			logger.error('Failed to refresh conversations', { message: err });
		}
		setIsPTRing(false);
	}, [refetch, refetchInbox, setIsPTRing]);

	const onEndReached = useCallback(async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more conversations', { message: err });
		}
	}, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);

	const onSoftReset = useCallback(async () => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
		if (isWithinSplitView) {
			// module-level singleton persists scroll across remounts by design
			splitViewLeftScroll.current = 0;
			restoredRef.current = true;
		}
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh conversations', { message: err });
		}
	}, [scrollElRef, refetch, isWithinSplitView]);

	// Restore the saved scroll offset once the list has rendered enough
	// content to honor it. Module-level ref survives ChatList re-mounts that
	// happen on in-splitview navigation (see leftColumnScroll.ts).
	const restoredRef = useRef(false);
	const onContentSizeChange = useCallback(
		(_w: number, h: number) => {
			if (!isWithinSplitView || restoredRef.current) return;
			const offset = splitViewLeftScroll.current;
			if (offset > 0 && h >= offset) {
				scrollElRef.current?.scrollToOffset({ offset, animated: false });
				// eslint-disable-next-line react-hooks/immutability -- a set-once flag mutated in an event handler; useRef's .current write is the intended escape hatch here
				restoredRef.current = true;
			}
		},
		[isWithinSplitView, scrollElRef],
	);

	const isScreenFocused = useIsFocused();
	useEffect(() => {
		if (!isScreenFocused) {
			return;
		}
		return softReset.subscribe(() => void onSoftReset());
	}, [onSoftReset, isScreenFocused]);

	if (conversations.length === 0) {
		return (
			<Layout.Center style={{ minHeight: '100%' }}>
				{isLoading ? (
					<ChatListLoadingPlaceholder />
				) : (
					<>
						{isError ? (
							<>
								<View style={[a.pt_3xl, a.align_center]}>
									<CircleInfoIcon size="4xl" fill={colors.textContrastLow} />
									<Text style={[a.pt_md, a.pb_sm, a.text_2xl, a.font_semi_bold]}>
										{m['common.error.whoops']()}
									</Text>
									<Text
										style={[
											a.text_md,
											a.pb_xl,
											a.text_center,
											a.leading_snug,
											t.atoms.text_contrast_medium,
											{ maxWidth: 360 },
										]}
									>
										{cleanError(error) || m['screens.messages.chats.reload.error']()}
									</Text>

									<Button
										label={m['screens.messages.chats.reload.action']()}
										size="small"
										color="secondary_inverted"
										onPress={() => void refetch()}
									>
										<ButtonText>{m['common.action.retry']()}</ButtonText>
										<ButtonIcon icon={RetryIcon} />
									</Button>
								</View>
							</>
						) : isWithinSplitView ? (
							<EmptyState
								message={m['screens.messages.chats.inboxEmpty']()}
								icon={InboxLargeIcon}
								iconSize="4xl"
								messageColor="text"
								iconColor={t.atoms.text.color}
								className={css.emptyTall}
							/>
						) : (
							<EmptyState
								message={m['screens.messages.conversation.sayHi']()}
								icon={BubbleSmileIcon}
								iconSize="4xl"
								messageColor="text"
								iconColor={t.atoms.text.color}
								button={
									chatStatus?.chatDisabled
										? undefined
										: {
												label: m['common.chat.action.new'](),
												text: m['common.chat.action.new'](),
												onPress: wrappedOpenChatControl,
												size: 'small',
												color: 'primary',
												icon: MessagePlusIcon,
											}
								}
								className={css.emptyTall}
							/>
						)}
					</>
				)}
			</Layout.Center>
		);
	}

	return (
		<List
			ref={scrollElRef}
			data={conversations}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			refreshing={isPTRing}
			onRefresh={() => void onRefresh()}
			onEndReached={() => void onEndReached()}
			ListHeaderComponent={
				chatStatus?.chatDisabled ? (
					<ChatDisabled shape="banner" style={[isWithinSplitView && a.mb_sm]} />
				) : undefined
			}
			ListFooterComponent={
				<ListFooter
					isFetchingNextPage={isFetchingNextPage}
					error={cleanError(error)}
					onRetry={fetchNextPage}
					className={css.footer}
					hasNextPage={hasNextPage}
				/>
			}
			onEndReachedThreshold={0}
			onContentSizeChange={onContentSizeChange}
			initialNumToRender={initialNumToRender}
			windowSize={11}
			desktopFixedHeight
			sideBorders={false}
			disableFullWindowScroll={isWithinSplitView}
			style={
				isWithinSplitView && [
					a.w_full,
					{
						scrollbarWidth: 'thin',
						scrollbarColor: `${t.palette.contrast_100} transparent`,
					} as WebScrollStyle,
				]
			}
			contentContainerStyle={isWithinSplitView && !chatStatus?.chatDisabled && a.py_sm}
		/>
	);
}

export function Header({
	newChatHandle,
	chatStatus,
}: {
	newChatHandle: Dialog.DialogHandle;
	chatStatus: ChatStatus | undefined;
}) {
	const { gtMobile } = useBreakpoints();
	const { isWithinSplitView } = useIsWithinSplitView();

	// In split view, the left column (and this header) stays mounted while the
	// right column shows the selected route. Pushing would stack duplicate routes
	// on repeated clicks, so navigate instead to dedupe by route + params.
	const action = isWithinSplitView ? 'navigate' : 'push';

	const { data: unreadCounts } = useUnreadCountsQuery();
	const requestCount = unreadCounts?.unreadRequestConvos ?? 0;

	const wrappedOpenChatControl = () => {
		newChatHandle.open(null);
	};

	return (
		<Layout.Header.Outer>
			{gtMobile ? (
				<>
					<Layout.Header.Content align="left">
						<Layout.Header.TitleText>{m['screens.messages.chats.title']()}</Layout.Header.TitleText>
					</Layout.Header.Content>

					<View style={[a.flex_row, a.align_center, a.gap_sm]}>
						<InboxRequests count={requestCount} variant="solid" action={action} />
						<ChatSettingsMenu
							action={action}
							render={
								<WebButton
									label={m['common.chat.optionsLabel']()}
									size="small"
									color="secondary"
									shape="round"
								>
									<WebButtonIcon icon={SettingsIcon} />
								</WebButton>
							}
						/>
						{!chatStatus?.chatDisabled && (
							<Button
								label={m['common.chat.action.new']()}
								color="primary"
								size="small"
								shape="round"
								onPress={wrappedOpenChatControl}
							>
								<ButtonIcon icon={NewChatIcon} />
							</Button>
						)}
					</View>
				</>
			) : (
				<>
					<Layout.Header.MenuButton />
					<Layout.Header.Content align="left">
						<Layout.Header.TitleText>{m['screens.messages.chats.title']()}</Layout.Header.TitleText>
					</Layout.Header.Content>
					<InboxRequests count={requestCount} variant="ghost" />
					<Layout.Header.Slot>
						<ChatSettingsMenu
							action={action}
							render={
								<WebButton
									label={m['common.chat.optionsLabel']()}
									size="small"
									variant="ghost"
									color="secondary"
									shape="round"
								>
									<WebButtonIcon icon={SettingsIcon} size="lg" />
								</WebButton>
							}
						/>
					</Layout.Header.Slot>
				</>
			)}
		</Layout.Header.Outer>
	);
}

function ChatSettingsMenu({
	action,
	render,
}: {
	action: 'navigate' | 'push';
	render: ComponentProps<typeof Menu.Trigger>['render'];
}) {
	const navigation = useNavigation<NavigationProp>();

	const { mutate: markAllChatsRead } = useUpdateAllRead('accepted', {
		onMutate: () => {
			Toast.show(m['screens.messages.chats.markAllRead.toast'](), { type: 'success' });
		},
		onError: () => {
			Toast.show(m['screens.messages.chats.markAllRead.error'](), { type: 'error' });
		},
	});

	return (
		<Menu.Root>
			<Menu.Trigger render={render} />
			<Menu.Popup label={m['common.chat.optionsLabel']()}>
				<Menu.Group>
					<Menu.Item
						label={m['screens.messages.chats.markAllRead.action']()}
						onClick={() => markAllChatsRead()}
					>
						<Menu.ItemIcon icon={CircleCheckIcon} />
						<Menu.ItemText>{m['screens.messages.chats.markAllRead.action']()}</Menu.ItemText>
					</Menu.Item>
					<Menu.Item
						label={m['common.chat.settingsLabel']()}
						onClick={() => {
							if (action === 'navigate') {
								navigation.navigate('MessagesSettings');
							} else {
								navigation.push('MessagesSettings');
							}
						}}
					>
						<Menu.ItemIcon icon={SettingsIcon} />
						<Menu.ItemText>{m['common.chat.settingsLabel']()}</Menu.ItemText>
					</Menu.Item>
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
}
