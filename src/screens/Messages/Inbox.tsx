import { useRef } from 'react';

import type { ChatBskyConvoDefs, ChatBskyConvoListConvoRequests, ChatBskyGroupDefs } from '@atcute/bluesky';

import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';

import { cleanError } from '#/lib/strings/errors';

import { useUnreadCountsQuery } from '#/state/queries/messages/get-unread-counts';
import { useListConvoRequests } from '#/state/queries/messages/list-conversation-requests';
import { useUpdateAllRead } from '#/state/queries/messages/update-all-read';
import { useTitle } from '#/state/use-title';

import { EmptyState } from '#/components/EmptyState';
import { useRefreshOnFocus } from '#/components/hooks/useRefreshOnFocus';
import { List } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import ArrowLeftIcon from '#/icons/central/ArrowLeft_round_outlined_radius1_stroke2.svg';
import RetryIcon from '#/icons/central/ArrowRotateCounterClockwise_round_outlined_radius1_stroke2.svg';
import InboxLargeIcon from '#/icons/central/Box2_round_outlined_radius1_stroke2.svg';
import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import CircleInfoIcon from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

import { ChatListLoadingPlaceholder } from './components/ChatListLoadingPlaceholder';
import { OutgoingRequestListItem } from './components/OutgoingRequestListItem';
import { RequestListItem } from './components/RequestListItem';
import { useIsWithinSplitView } from './components/splitView/context';
import * as splitViewCss from './components/splitView/MessagesSplitViewLayout.css';
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

				{hasUnreadConvos && (
					<Layout.Header.Slot>
						<MarkAsReadHeaderButton />
					</Layout.Header.Slot>
				)}
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
	const router = useRouter();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const { isWithinSplitView } = useIsWithinSplitView();

	useRequestMessagePollInterval();

	const { isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } =
		listConvosQuery;

	useRefreshOnFocus(refetch);

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || isError) {
			return;
		}
		void fetchNextPage();
	};

	if (conversations.length < 1) {
		if (isLoading) {
			return <ChatListLoadingPlaceholder />;
		}

		if (isError) {
			return (
				<div className={css.errorWrap}>
					<CircleInfoIcon className={css.circleInfoIcon} />
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
				iconSize="_4xl"
				messageColor="text"
				iconColor="text"
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
										router.navigate({ to: { name: 'Messages' } });
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

	const list = (
		<List
			data={conversations}
			estimateHeight={REQUEST_ITEM_HEIGHT_ESTIMATE}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			onEndReached={onEndReached}
			onEndReachedThreshold={0}
			scrollRoot={isWithinSplitView ? scrollContainerRef : undefined}
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

	if (isWithinSplitView) {
		return (
			<div ref={scrollContainerRef} className={splitViewCss.splitScroller}>
				{list}
			</div>
		);
	}

	return list;
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
