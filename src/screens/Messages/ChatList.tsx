import { type ComponentProps, useRef } from 'react';

import type { ChatBskyActorGetStatus, ChatBskyConvoDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/errors';
import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { conversationTarget } from '#/lib/routes/targets';

import { softReset } from '#/state/events';
import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';
import { useUnreadCountsQuery } from '#/state/queries/messages/get-unread-counts';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';
import { useUpdateAllRead } from '#/state/queries/messages/update-all-read';
import { useTitle } from '#/state/use-title';

import { BlankState } from '#/components/BlankState';
import * as Dialog from '#/components/Dialog';
import { NewChatDialog } from '#/components/dms/dialogs/NewChatDialog';
import { ErrorState } from '#/components/ErrorState';
import { FAB } from '#/components/FAB';
import { useRefreshOnFocus } from '#/components/hooks/useRefreshOnFocus';
import { List, type ListMethods } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import * as Menu from '#/components/Menu';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import NewChatIcon from '#/icons/central-custom/MessagePlus_round_outlined_radius1_stroke2.svg';
import InboxIcon from '#/icons/central/Box2_round_outlined_radius1_stroke2.svg';
import CircleCheckIcon from '#/icons/central/CircleCheck_round_outlined_radius1_stroke2.svg';
import SettingsIcon from '#/icons/central/SettingsGear2_round_outlined_radius1_stroke2.svg';
import BubbleSmileIcon from '#/icons/original/BubbleSmile.svg';
import { m } from '#/paraglide/messages';
import { useFocusEffect, useRouter } from '#/router';

import * as css from './ChatList.css';
import { ChatDisabled } from './components/ChatDisabled';
import { ChatListItem } from './components/ChatListItem';
import { ChatListLoadingPlaceholder } from './components/ChatListLoadingPlaceholder';
import { InboxRequests } from './components/InboxRequests';
import { useIsWithinSplitView } from './components/splitView/context';
import * as splitViewCss from './components/splitView/MessagesSplitViewLayout.css';
import { useRequestMessagePollInterval } from './use-request-poll-interval';

const CHAT_ITEM_HEIGHT_ESTIMATE = 78;

type ListItem = {
	type: 'conversation';
	conversation: ChatBskyConvoDefs.ConvoView;
	selected: boolean;
};

type ChatStatus = ChatBskyActorGetStatus.$output;

function renderItem({ item }: { item: ListItem }) {
	return <ChatListItem convo={item.conversation} selected={item.selected} />;
}

function SayHiBlankState({
	chatDisabled,
	onStartChat,
}: {
	chatDisabled: boolean | undefined;
	onStartChat: () => void;
}) {
	return (
		<BlankState
			actions={
				!chatDisabled && (
					<Button
						color="primary"
						label={m['common.chat.action.new']()}
						onClick={onStartChat}
						size="small"
						variant="solid"
					>
						<ButtonIcon icon={NewChatIcon} />
						<ButtonText>{m['common.chat.action.new']()}</ButtonText>
					</Button>
				)
			}
			icon={BubbleSmileIcon}
			message={m['screens.messages.conversation.sayHi']()}
		/>
	);
}

function keyExtractor(item: ListItem) {
	return item.conversation.id;
}

export function MessagesScreen() {
	const { isWithinSplitView } = useIsWithinSplitView();
	const router = useRouter();
	const newChatHandle = Dialog.useDialogHandle();
	const { data: chatStatus } = useChatActorStatusQuery();

	useTitle(m['navigation.chat.title']());

	useRequestMessagePollInterval();

	const onNewChat = (conversation: string) => router.navigate({ to: conversationTarget(conversation) });

	if (isWithinSplitView) {
		return (
			<>
				<SayHiBlankState
					chatDisabled={chatStatus?.chatDisabled}
					onStartChat={() => newChatHandle.open(null)}
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
					render={<FAB icon={NewChatIcon} label={m['common.chat.action.new']()} />}
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

	const { data, isPending, isFetchingNextPage, fetchNextPage, isError, error, refetch } = useListConvosQuery({
		status: 'accepted',
	});

	const { refetch: refetchInbox } = useListConvosQuery({
		status: 'request',
	});

	useRefreshOnFocus(refetch);
	useRefreshOnFocus(refetchInbox);

	const conversations =
		data?.pages
			.flatMap((page) => page.convos)
			.map((convo): ListItem => ({
				type: 'conversation',
				conversation: convo,
				selected: convo.id === selectedChat,
			})) ?? [];

	useFocusEffect(() => {
		return softReset.subscribe(() => {
			scrollElRef.current?.scrollToOffset({
				animated: false,
				offset: 0,
			});

			refetch().catch(() => {});
		});
	});

	if (conversations.length === 0) {
		return (
			<>
				{isPending ? (
					<ChatListLoadingPlaceholder />
				) : isError ? (
					<ErrorState message={m['screens.messages.chats.reload.error']()} onRetry={() => void refetch()} />
				) : isWithinSplitView ? (
					<BlankState icon={InboxIcon} message={m['screens.messages.chats.inboxEmpty']()} />
				) : (
					<SayHiBlankState chatDisabled={chatStatus?.chatDisabled} onStartChat={openChatControl} />
				)}
			</>
		);
	}

	const list = (
		<List
			ref={scrollElRef}
			scrollRoot={isWithinSplitView ? scrollContainerRef : undefined}
			data={conversations}
			estimateHeight={CHAT_ITEM_HEIGHT_ESTIMATE}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			ListHeaderComponent={
				chatStatus?.chatDisabled ? (
					<ChatDisabled shape="banner" className={isWithinSplitView ? css.banner : undefined} />
				) : undefined
			}
			ListFooterComponent={
				<ListTail.Frame border={false}>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : null}
				</ListTail.Frame>
			}
			onEndReached={() => {
				if (isError) {
					return;
				}
				void fetchNextPage();
			}}
			onEndReachedThreshold={0}
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

					<Layout.Header.EndSlot>
						<InboxRequests count={requestCount} variant="solid" action={action} />
						<ChatSettingsMenu
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
					</Layout.Header.EndSlot>
				</>
			) : (
				<>
					<Layout.Header.MenuButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['screens.messages.chats.title']()}</Layout.Header.TitleText>
					</Layout.Header.Content>

					<Layout.Header.EndSlot>
						<InboxRequests count={requestCount} variant="ghost" />

						<ChatSettingsMenu
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
					</Layout.Header.EndSlot>
				</>
			)}
		</Layout.Header.Outer>
	);
}

function ChatSettingsMenu({ render }: { render: ComponentProps<typeof Menu.Trigger>['render'] }) {
	const router = useRouter();

	const { mutate: markAllChatsRead } = useUpdateAllRead('accepted', {
		onMutate: () => {
			Toast.show(m['screens.messages.chats.markAllRead.toast'](), { type: 'success' });
		},
		onError: () => {
			Toast.show(m['screens.messages.chats.markAllRead.error'](), { type: 'error' });
		},
	});

	const { mutate: markAllRequestsRead } = useUpdateAllRead('request', {
		onMutate: () => {
			Toast.show(m['screens.messages.requests.markAllRead.toast'](), { type: 'success' });
		},
		onError: () => {
			Toast.show(m['screens.messages.requests.markAllRead.error'](), { type: 'error' });
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
						label={m['screens.messages.requests.markAllRead.action']()}
						onClick={() => markAllRequestsRead()}
					>
						<Menu.ItemIcon icon={InboxIcon} />
						<Menu.ItemText>{m['screens.messages.requests.markAllRead.action']()}</Menu.ItemText>
					</Menu.Item>
					<Menu.Item
						label={m['common.chat.settingsLabel']()}
						onClick={() => {
							router.navigate({ to: { name: 'MessagesSettings' } });
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
