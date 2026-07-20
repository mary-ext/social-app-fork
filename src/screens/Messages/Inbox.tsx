import type { ChatBskyConvoDefs, ChatBskyConvoListConvoRequests, ChatBskyGroupDefs } from '@atcute/bluesky';

import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';

import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';

import { useUnreadCountsQuery } from '#/state/queries/messages/get-unread-counts';
import { useListConvoRequests } from '#/state/queries/messages/list-conversation-requests';
import { useUpdateAllRead } from '#/state/queries/messages/update-all-read';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';

import { useRefreshOnFocus } from '#/components/hooks/useRefreshOnFocus';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon } from '#/components/icons/Arrow';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Inbox_Stroke2_Corner2_Rounded_Large as InboxLargeIcon } from '#/components/icons/Inbox';
import { List } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useNavigate, useRouter } from '#/routes';
import { colors } from '#/styles/colors';

import { ChatListLoadingPlaceholder } from './components/ChatListLoadingPlaceholder';
import { OutgoingRequestListItem } from './components/OutgoingRequestListItem';
import { RequestListItem } from './components/RequestListItem';
import { useIsWithinSplitView } from './components/splitView/context';
import * as css from './Inbox.css';
import { useRequestMessagePollInterval } from './use-request-poll-interval';

const REQUEST_ITEM_HEIGHT_ESTIMATE = 130;

type RequestItem =
	| { type: 'incoming'; view: ChatBskyConvoDefs.ConvoView }
	| { type: 'outgoing'; view: ChatBskyGroupDefs.JoinRequestConvoView };

export function MessagesInboxScreen() {
	useTitle(m['navigation.chat.requests.title']());

	const listConvosQuery = useListConvoRequests();
	const { data } = listConvosQuery;

	const conversations: RequestItem[] = [];
	if (data?.pages) {
		for (const page of data.pages) {
			for (const item of page.requests) {
				if (item.$type === 'chat.bsky.convo.defs#convoView') {
					conversations.push({ type: 'incoming', view: item });
				} else if (item.$type === 'chat.bsky.group.defs#joinRequestConvoView') {
					conversations.push({ type: 'outgoing', view: item });
				}
			}
		}
	}

	const { data: unreadCounts } = useUnreadCountsQuery();
	const hasUnreadConvos = (unreadCounts?.unreadRequestConvos ?? 0) > 0;

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
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
	listConvosQuery: UseInfiniteQueryResult<InfiniteData<ChatBskyConvoListConvoRequests.$output>>;
	conversations: RequestItem[];
}) {
	const navigate = useNavigate();
	const router = useRouter();
	const { isWithinSplitView } = useIsWithinSplitView();

	useRequestMessagePollInterval();

	const { isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } =
		listConvosQuery;

	useRefreshOnFocus(refetch);

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more conversations', { message: err });
		}
	};

	if (conversations.length < 1) {
		if (isLoading) {
			return <ChatListLoadingPlaceholder />;
		}

		if (isError) {
			return (
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
			);
		}

		return (
			<EmptyState
				message={m['screens.messages.chats.inboxZero']()}
				icon={InboxLargeIcon}
				iconSize="4xl"
				messageColor="text"
				iconColor={colors.text}
				button={
					isWithinSplitView
						? undefined
						: {
								label: m['screens.messages.chats.back'](),
								text: m['common.action.back'](),
								onPress: () => {
									if (router.canGoBack) {
										router.back();
									} else {
										navigate('Messages');
									}
								},
								size: 'small',
								color: 'secondary',
								icon: ArrowLeftIcon,
							}
				}
				className={css.empty}
			/>
		);
	}

	return (
		<List
			data={conversations}
			estimateHeight={REQUEST_ITEM_HEIGHT_ESTIMATE}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			onEndReached={() => void onEndReached()}
			onEndReachedThreshold={0}
			ListFooterComponent={
				<ListFooter
					border={false}
					error={cleanError(error)}
					hasNextPage={hasNextPage}
					isFetchingNextPage={isFetchingNextPage}
					onRetry={fetchNextPage}
				/>
			}
		/>
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
			onClick={() => markAllRead()}
		>
			<ButtonIcon icon={CheckIcon} />
			<ButtonText>{m['screens.messages.requests.markAllRead.action']()}</ButtonText>
		</Button>
	);
}
