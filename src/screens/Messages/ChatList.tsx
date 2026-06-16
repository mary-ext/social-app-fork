import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import type { ChatBskyActorGetStatus, ChatBskyConvoDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAnimatedRef } from '#/lib/animations/reanimatedCompat';
import { useAppState } from '#/lib/appState';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import type { MessagesTabNavigatorParams, NavigationProp } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { listenSoftReset } from '#/state/events';
import { MESSAGE_SCREEN_POLL_INTERVAL } from '#/state/messages/convo/const';
import { useMessagesEventBus } from '#/state/messages/events';
import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';
import { useUnreadCountsQuery } from '#/state/queries/messages/get-unread-counts';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';
import { List, type ListRef } from '#/view/com/util/List';
import { ChatListLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { type DialogControlProps, useDialogControl } from '#/components/Dialog';
import { NewChat } from '#/components/dms/dialogs/NewChatDialog';
import { useRefreshOnFocus } from '#/components/hooks/useRefreshOnFocus';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { BubbleSmile_Stroke2_Corner2_Rounded_Large as BubbleSmileIcon } from '#/components/icons/Bubble';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Inbox_Stroke2_Corner2_Rounded_Large as InboxLargeIcon } from '#/components/icons/Inbox';
import {
	MessagePlus_Stroke2_Corner0_Rounded as MessagePlusIcon,
	MessagePlus_Stroke2_Corner0_Rounded as NewChatIcon,
} from '#/components/icons/Message';
import { SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon } from '#/components/icons/SettingsGear2';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';
import { ListFooter } from '#/components/Lists';
import { Text } from '#/components/Typography';

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
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const t = useTheme();
	const newChatControl = useDialogControl();
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

	const onNewChat = useCallback(
		(conversation: string) => navigation.navigate('MessagesConversation', { conversation }),
		[navigation],
	);

	if (isWithinSplitView) {
		return (
			<>
				<EmptyState
					message={l`Say hi to someone`}
					icon={BubbleSmileIcon}
					textStyle={t.atoms.text}
					iconColor={t.atoms.text.color}
					iconSize="4xl"
					button={
						chatStatus?.chatDisabled
							? undefined
							: {
									label: l`New chat`,
									text: l`New chat`,
									onPress: newChatControl.open,
									size: 'small',
									color: 'primary',
									icon: MessagePlusIcon,
								}
					}
					style={[a.h_full, a.justify_center, a.pb_5xl]}
				/>
				<NewChat onNewChat={onNewChat} control={newChatControl} />
			</>
		);
	}

	return (
		<Layout.Screen testID="messagesScreen">
			<Header newChatControl={newChatControl} chatStatus={chatStatus} />
			<ChatList newChatControl={newChatControl} chatStatus={chatStatus} />
			<NewChat onNewChat={onNewChat} control={newChatControl} />
		</Layout.Screen>
	);
}

export function ChatList({
	selectedChat,
	newChatControl,
	chatStatus,
}: {
	selectedChat?: string;
	newChatControl: DialogControlProps;
	chatStatus: ChatStatus | undefined;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const scrollElRef: ListRef = useAnimatedRef();
	const { isWithinSplitView } = useIsWithinSplitView();

	const openChatControl = useCallback(() => {
		newChatControl.open();
	}, [newChatControl]);

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
		return listenSoftReset(() => void onSoftReset());
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
									<CircleInfoIcon width={48} fill={t.atoms.text_contrast_low.color} />
									<Text style={[a.pt_md, a.pb_sm, a.text_2xl, a.font_semi_bold]}>
										<Trans>Whoops!</Trans>
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
										{cleanError(error) || l`Failed to load conversations`}
									</Text>

									<Button
										label={l`Reload conversations`}
										size="small"
										color="secondary_inverted"
										onPress={() => void refetch()}
									>
										<ButtonText>
											<Trans>Retry</Trans>
										</ButtonText>
										<ButtonIcon icon={RetryIcon} />
									</Button>
								</View>
							</>
						) : isWithinSplitView ? (
							<EmptyState
								message={l`Inbox empty`}
								icon={InboxLargeIcon}
								iconSize="4xl"
								textStyle={t.atoms.text}
								iconColor={t.atoms.text.color}
								style={[a.h_full, a.justify_center, { paddingBottom: 120 }]}
							/>
						) : (
							<EmptyState
								message={l`Say hi to someone`}
								icon={BubbleSmileIcon}
								iconSize="4xl"
								textStyle={t.atoms.text}
								iconColor={t.atoms.text.color}
								button={
									chatStatus?.chatDisabled
										? undefined
										: {
												label: l`New chat`,
												text: l`New chat`,
												onPress: wrappedOpenChatControl,
												size: 'small',
												color: 'primary',
												icon: MessagePlusIcon,
											}
								}
								style={[a.h_full, a.justify_center, { paddingBottom: 120 }]}
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
					style={{ borderColor: 'transparent' }}
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
	newChatControl,
	chatStatus,
}: {
	newChatControl: DialogControlProps;
	chatStatus: ChatStatus | undefined;
}) {
	const { t: l } = useLingui();
	const { gtMobile } = useBreakpoints();
	const { isWithinSplitView } = useIsWithinSplitView();

	// In split view, the left column (and this header) stays mounted while the
	// right column shows the selected route. Pushing would stack duplicate routes
	// on repeated clicks, so navigate instead to dedupe by route + params.
	const action = isWithinSplitView ? 'navigate' : 'push';

	const { data: unreadCounts } = useUnreadCountsQuery();
	const requestCount = unreadCounts?.unreadRequestConvos ?? 0;

	const openChatControl = useCallback(() => {
		newChatControl.open();
	}, [newChatControl]);
	const wrappedOpenChatControl = openChatControl;

	return (
		<Layout.Header.Outer>
			{gtMobile ? (
				<>
					<Layout.Header.Content align="left">
						<Layout.Header.TitleText>
							<Trans>Chats</Trans>
						</Layout.Header.TitleText>
					</Layout.Header.Content>

					<View style={[a.flex_row, a.align_center, a.gap_sm]}>
						<InboxRequests count={requestCount} variant="solid" action={action} />
						<Link
							to="/messages/settings"
							action={action}
							label={l`Chat settings`}
							size="small"
							color="secondary"
							shape="round"
							style={[a.justify_center]}
						>
							<ButtonIcon icon={SettingsIcon} />
						</Link>
						{!chatStatus?.chatDisabled && (
							<Button
								label={l`New chat`}
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
						<Layout.Header.TitleText>
							<Trans>Chats</Trans>
						</Layout.Header.TitleText>
					</Layout.Header.Content>
					<InboxRequests count={requestCount} variant="ghost" />
					<Layout.Header.Slot>
						<Link
							to="/messages/settings"
							label={l`Chat settings`}
							size="small"
							variant="ghost"
							color="secondary"
							shape="round"
							style={[a.justify_center]}
						>
							<ButtonIcon icon={SettingsIcon} size="lg" />
						</Link>
					</Layout.Header.Slot>
				</>
			)}
		</Layout.Header.Outer>
	);
}
