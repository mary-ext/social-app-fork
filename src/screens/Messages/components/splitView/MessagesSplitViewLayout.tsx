import { Outlet, useRoute } from '@oomfware/stacker';

import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';

import { useLayoutBreakpoints } from '#/alf';

import * as Dialog from '#/components/Dialog';
import { NewChatDialog } from '#/components/dms/dialogs/NewChatDialog';
import { LockScroll } from '#/components/LockScroll';

import { useNavigate } from '#/routes';

import { ChatList, Header as ChatListHeader } from '../../ChatList';
import { SplitViewProvider } from './context';
import * as css from './MessagesSplitViewLayout.css';

/** layout shared by every message screen: the persistent chat-list column plus the active conversation. */
export function MessagesSplitViewLayout() {
	const { rightNavVisible } = useLayoutBreakpoints();

	if (!rightNavVisible) {
		return <Outlet />;
	}

	return <MessagesSplitViewLayoutInner />;
}

function MessagesSplitViewLayoutInner() {
	const newChatHandle = Dialog.useDialogHandle();
	const { data: chatStatus } = useChatActorStatusQuery();
	const match = useRoute();
	const navigate = useNavigate();

	const onNewChat = (conversation: string) => navigate('MessagesConversation', { conversation });

	const selectedChat =
		(match.name === 'MessagesConversation' || match.name === 'MessagesConversationSettings') &&
		typeof match.params.conversation === 'string'
			? match.params.conversation
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
