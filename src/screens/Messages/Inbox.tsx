import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { ChatBskyConvoDefs, ChatBskyConvoListConvoRequests, ChatBskyGroupDefs } from '@atcute/bluesky';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';

import { useAppState } from '#/lib/appState';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import type { CommonNavigatorParams, NativeStackScreenProps, NavigationProp } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { MESSAGE_SCREEN_POLL_INTERVAL } from '#/state/messages/convo/const';
import { useMessagesEventBus } from '#/state/messages/events';
import { useListConvoRequests } from '#/state/queries/messages/list-conversation-requests';
import { useUpdateAllRead } from '#/state/queries/messages/update-all-read';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';
import { List } from '#/view/com/util/List';
import { ChatListLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useRefreshOnFocus } from '#/components/hooks/useRefreshOnFocus';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon } from '#/components/icons/Arrow';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Inbox_Stroke2_Corner2_Rounded_Large as InboxLargeIcon } from '#/components/icons/Inbox';
import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { OutgoingRequestListItem } from './components/OutgoingRequestListItem';
import { RequestListItem } from './components/RequestListItem';
import { useIsWithinSplitView } from './components/splitView/context';
import * as css from './Inbox.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesInbox'>;

export function MessagesInboxScreen(props: Props) {
	return <MessagesInboxScreenInner {...props} />;
}

type RequestItem =
	| { type: 'incoming'; view: ChatBskyConvoDefs.ConvoView }
	| { type: 'outgoing'; view: ChatBskyGroupDefs.JoinRequestConvoView };

export function MessagesInboxScreenInner({}: Props) {
	const listConvosQuery = useListConvoRequests();
	const { data } = listConvosQuery;

	const conversations = useMemo<RequestItem[]>(() => {
		if (!data?.pages) return [];
		const items: RequestItem[] = [];
		for (const page of data.pages) {
			for (const item of page.requests) {
				if (item.$type === 'chat.bsky.convo.defs#convoView') {
					items.push({ type: 'incoming', view: item });
				} else if (item.$type === 'chat.bsky.group.defs#joinRequestConvoView') {
					items.push({ type: 'outgoing', view: item });
				}
			}
		}
		return items;
	}, [data]);

	const hasUnreadConvos = useMemo(() => {
		return conversations.some(
			(item) =>
				item.type === 'incoming' &&
				item.view.members.every((member) => member.handle !== 'missing.invalid') &&
				item.view.unreadCount > 0,
		);
	}, [conversations]);

	return (
		<Layout.Screen testID="messagesInboxScreen">
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content align="left">
					<Layout.Header.TitleText>{m['screens.messages.requests.title']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				{hasUnreadConvos ? <MarkAsReadHeaderButton /> : <Layout.Header.Slot />}
			</Layout.Header.Outer>
			<RequestList listConvosQuery={listConvosQuery} conversations={conversations} />
		</Layout.Screen>
	);
}

function RequestList({
	listConvosQuery,
	conversations,
}: {
	listConvosQuery: UseInfiniteQueryResult<InfiniteData<ChatBskyConvoListConvoRequests.$output>, Error>;
	conversations: RequestItem[];
}) {
	const t = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const { isWithinSplitView } = useIsWithinSplitView();

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

	const initialNumToRender = useInitialNumToRender({ minItemHeight: 130 });
	const [isPTRing, setIsPTRing] = useState(false);

	const { isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } =
		listConvosQuery;

	useRefreshOnFocus(refetch);

	const onRefresh = useCallback(async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh conversations', { message: err });
		}
		setIsPTRing(false);
	}, [refetch, setIsPTRing]);

	const onEndReached = useCallback(async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more conversations', { message: err });
		}
	}, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);

	if (conversations.length < 1) {
		return (
			<Layout.Center style={[a.h_full]}>
				{isLoading ? (
					<ChatListLoadingPlaceholder />
				) : (
					<>
						{isError ? (
							<>
								<View style={[a.pt_3xl, a.align_center]}>
									<CircleInfoIcon width={48} fill={colors.textContrastLow} />
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
						) : (
							<EmptyState
								message={m['screens.messages.chats.inboxZero']()}
								icon={InboxLargeIcon}
								iconSize="4xl"
								messageColor="text"
								iconColor={t.atoms.text.color}
								button={
									isWithinSplitView
										? undefined
										: {
												label: m['screens.messages.chats.back'](),
												text: m['common.action.back'](),
												onPress: () => {
													if (navigation.canGoBack()) {
														navigation.goBack();
													} else {
														navigation.navigate('Messages', { animation: 'pop' });
													}
												},
												size: 'small',
												color: 'secondary',
												icon: ArrowLeftIcon,
											}
								}
								className={css.empty}
							/>
						)}
					</>
				)}
			</Layout.Center>
		);
	}

	return (
		<>
			<List
				data={conversations}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				refreshing={isPTRing}
				onRefresh={() => void onRefresh()}
				onEndReached={() => void onEndReached()}
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
				initialNumToRender={initialNumToRender}
				windowSize={11}
				desktopFixedHeight
				sideBorders={false}
			/>
		</>
	);
}

function keyExtractor(item: RequestItem) {
	return item.type === 'incoming' ? item.view.id : item.view.convoId;
}

function renderItem({ item }: { item: RequestItem }) {
	if (item.type === 'incoming') {
		return <RequestListItem convo={item.view} />;
	}
	return <OutgoingRequestListItem convo={item.view} />;
}

function MarkAsReadHeaderButton() {
	const { mutate: markAllRead } = useUpdateAllRead('request', {
		onMutate: () => {
			Toast.show(m['screens.messages.requests.markAllRead.toast'](), {
				type: 'success',
			});
		},
		onError: () => {
			Toast.show(m['screens.messages.requests.markAllRead.error'](), {
				type: 'error',
			});
		},
	});

	return (
		<Button
			label={m['screens.messages.requests.markAllRead.action']()}
			size="small"
			color="secondary"
			onPress={() => markAllRead()}
		>
			<ButtonIcon icon={CheckIcon} />
			<ButtonText>{m['screens.messages.requests.markAllRead.action']()}</ButtonText>
		</Button>
	);
}
