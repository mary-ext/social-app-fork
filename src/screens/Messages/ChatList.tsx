import { type ComponentProps, useCallback, useEffect, useRef } from 'react';

import type { ChatBskyActorGetStatus, ChatBskyConvoDefs } from '@atcute/bluesky';

import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppState } from '#/lib/appState';
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

import { useBreakpoints } from '#/alf';

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
import { List, type ListMethods } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import * as Menu from '#/components/Menu';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ChatList.css';
import { ChatDisabled } from './components/ChatDisabled';
import { ChatListItem } from './components/ChatListItem';
import { ChatListLoadingPlaceholder } from './components/ChatListLoadingPlaceholder';
import { InboxRequests } from './components/InboxRequests';
import { useIsWithinSplitView } from './components/splitView/context';
import { splitViewLeftScroll } from './components/splitView/leftColumnScroll';

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
	const newChatHandle = Dialog.useDialogHandle();
	const { data: chatStatus } = useChatActorStatusQuery();
	const pushToConversation = route.params?.pushToConversation;

	// navigate to a conversation from notification launch parameters, then clear the parameters to allow subsequent launches
	useEffect(() => {
		if (pushToConversation) {
			navigation.navigate('MessagesConversation', {
				conversation: pushToConversation,
			});
			navigation.setParams({ pushToConversation: undefined });
		}
	}, [navigation, pushToConversation]);

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
					iconColor={colors.text}
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
		<Layout.Screen>
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
	const scrollElRef = useRef<ListMethods | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const { isWithinSplitView } = useIsWithinSplitView();

	const openChatControl = () => {
		newChatHandle.open(null);
	};

	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } =
		useListConvosQuery({ status: 'accepted' });

	const { refetch: refetchInbox } = useListConvosQuery({
		status: 'request',
	});

	useRefreshOnFocus(refetch);
	useRefreshOnFocus(refetchInbox);

	const conversations: ListItem[] = data?.pages
		? data.pages
				.flatMap((page) => page.convos)
				.map((convo) => ({
					type: 'CONVERSATION',
					conversation: convo,
					selected: convo.id === selectedChat,
				}))
		: [];

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more conversations', { message: err });
		}
	};

	const restoredRef = useRef(false);

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
	}, [refetch, isWithinSplitView]);

	const onContentSizeChange = (_width: number, height: number) => {
		if (!isWithinSplitView || restoredRef.current) return;
		const offset = splitViewLeftScroll.current;
		if (offset > 0 && height >= offset) {
			scrollElRef.current?.scrollToOffset({ offset, animated: false });
			restoredRef.current = true;
		}
	};

	const onLeftColumnScroll = (e: React.UIEvent<HTMLDivElement>) => {
		splitViewLeftScroll.current = e.currentTarget.scrollTop;
	};

	const isScreenFocused = useIsFocused();
	useEffect(() => {
		if (!isScreenFocused) {
			return;
		}
		return softReset.subscribe(() => void onSoftReset());
	}, [onSoftReset, isScreenFocused]);

	if (conversations.length === 0) {
		return (
			<>
				{isLoading ? (
					<ChatListLoadingPlaceholder />
				) : isError ? (
					<div className={css.errorWrap}>
						<CircleInfoIcon size="4xl" fill={colors.textContrastLow} />
						<Text size="_2xl" weight="semiBold" className={css.errorTitle}>
							{m['common.error.whoops']()}
						</Text>
						<Text size="md" align="center" color="textContrastMedium" className={css.errorMessage}>
							{cleanError(error) || m['screens.messages.chats.reload.error']()}
						</Text>
						<Button
							label={m['screens.messages.chats.reload.action']()}
							size="small"
							color="secondary_inverted"
							onClick={() => void refetch()}
						>
							<ButtonText>{m['common.action.retry']()}</ButtonText>
							<ButtonIcon icon={RetryIcon} />
						</Button>
					</div>
				) : isWithinSplitView ? (
					<EmptyState
						message={m['screens.messages.chats.inboxEmpty']()}
						icon={InboxLargeIcon}
						iconSize="4xl"
						messageColor="text"
						iconColor={colors.text}
						className={css.emptyTall}
					/>
				) : (
					<EmptyState
						message={m['screens.messages.conversation.sayHi']()}
						icon={BubbleSmileIcon}
						iconSize="4xl"
						messageColor="text"
						iconColor={colors.text}
						button={
							chatStatus?.chatDisabled
								? undefined
								: {
										label: m['common.chat.action.new'](),
										text: m['common.chat.action.new'](),
										onPress: openChatControl,
										size: 'small',
										color: 'primary',
										icon: MessagePlusIcon,
									}
						}
						className={css.emptyTall}
					/>
				)}
			</>
		);
	}

	const list = (
		<List
			ref={scrollElRef}
			data={conversations}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			onEndReached={() => void onEndReached()}
			onEndReachedThreshold={0}
			onContentSizeChange={onContentSizeChange}
			scrollRoot={isWithinSplitView ? scrollContainerRef : undefined}
			ListHeaderComponent={
				chatStatus?.chatDisabled ? (
					<ChatDisabled shape="banner" className={isWithinSplitView ? css.banner : undefined} />
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
		/>
	);

	if (isWithinSplitView) {
		return (
			<div ref={scrollContainerRef} className={css.splitScroller} onScroll={onLeftColumnScroll}>
				{list}
			</div>
		);
	}

	return list;
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

	// navigate instead of push in split view to avoid stacking duplicate routes on repeated clicks
	const action = isWithinSplitView ? 'navigate' : 'push';

	const { data: unreadCounts } = useUnreadCountsQuery();
	const requestCount = unreadCounts?.unreadRequestConvos ?? 0;

	const openChatControl = () => {
		newChatHandle.open(null);
	};

	return (
		<Layout.Header.Outer>
			{gtMobile ? (
				<>
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['screens.messages.chats.title']()}</Layout.Header.TitleText>
					</Layout.Header.Content>

					<Layout.Header.Slot>
						<InboxRequests count={requestCount} variant="solid" action={action} />
						<ChatSettingsMenu
							action={action}
							render={
								<Button label={m['common.chat.optionsLabel']()} size="small" color="secondary" shape="round">
									<ButtonIcon icon={SettingsIcon} />
								</Button>
							}
						/>
						{!chatStatus?.chatDisabled && (
							<Button
								label={m['common.chat.action.new']()}
								color="primary"
								size="small"
								shape="round"
								onClick={openChatControl}
							>
								<ButtonIcon icon={NewChatIcon} />
							</Button>
						)}
					</Layout.Header.Slot>
				</>
			) : (
				<>
					<Layout.Header.MenuButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['screens.messages.chats.title']()}</Layout.Header.TitleText>
					</Layout.Header.Content>

					<Layout.Header.Slot>
						<InboxRequests count={requestCount} variant="ghost" />

						<ChatSettingsMenu
							action={action}
							render={
								<Button
									label={m['common.chat.optionsLabel']()}
									size="small"
									variant="ghost"
									color="secondary"
									shape="round"
								>
									<ButtonIcon icon={SettingsIcon} size="lg" />
								</Button>
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
			<Menu.Popup label={m['common.chat.optionsLabel']()} align="center">
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
