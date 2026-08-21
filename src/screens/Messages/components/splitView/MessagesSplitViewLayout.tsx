import { Outlet } from '@oomfware/stacker';

import { useLayoutBreakpoints } from '#/lib/hooks/use-breakpoints';
import { conversationTarget } from '#/lib/routes/targets';

import { CurrentConvoIdProvider } from '#/state/messages/current-convo-id';
import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';
import { ListConvosProvider } from '#/state/queries/messages/list-conversations';

import * as Dialog from '#/components/Dialog';
import { NewChatDialog } from '#/components/dms/dialogs/NewChatDialog';
import { LockScroll } from '#/components/LockScroll';

import { useRouter, useTarget } from '#/router';

import { ChatList, Header as ChatListHeader } from '../../ChatList';
import { SplitViewProvider } from './context';
import * as css from './MessagesSplitViewLayout.css';

/** layout shared by every message screen: the persistent chat-list column plus the active conversation. */
export function MessagesSplitViewLayout() {
	return (
		<CurrentConvoIdProvider>
			<ListConvosProvider>
				<MessagesSplitViewLayoutContent />
			</ListConvosProvider>
		</CurrentConvoIdProvider>
	);
}

function MessagesSplitViewLayoutContent() {
	const { rightNavVisible } = useLayoutBreakpoints();

	if (!rightNavVisible) {
		return <Outlet />;
	}

	return <MessagesSplitViewLayoutInner />;
}

function MessagesSplitViewLayoutInner() {
	const newChatHandle = Dialog.useDialogHandle();
	const { data: chatStatus } = useChatActorStatusQuery();
	const target = useTarget();
	const router = useRouter();

	const onNewChat = (conversation: string) => router.navigate({ to: conversationTarget(conversation) });

	const selectedChat =
		target.name === 'MessagesConversation' || target.name === 'MessagesConversationSettings'
			? target.conversation
			: undefined;

	return (
		<div className={css.container}>
			<LockScroll />
			<SplitViewProvider side="left">
				<div className={css.leftColumn}>
					<ChatListHeader newChatHandle={newChatHandle} chatStatus={chatStatus} />
					<ChatList newChatHandle={newChatHandle} selectedChat={selectedChat} chatStatus={chatStatus} />
					<NewChatDialog handle={newChatHandle} onNewChat={onNewChat} />
				</div>
			</SplitViewProvider>
			<SplitViewProvider side="right">
				<div className={css.centerColumn}>
					<Outlet />
				</div>
			</SplitViewProvider>
		</div>
	);
}
