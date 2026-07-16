import { View } from 'react-native';

import { Outlet, useRoute } from '@oomfware/stacker';

import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';

import { atoms as a, useLayoutBreakpoints, useTheme } from '#/alf';

import * as Dialog from '#/components/Dialog';
import { NewChatDialog } from '#/components/dms/dialogs/NewChatDialog';
import { LockScroll } from '#/components/LockScroll';

import { useNavigate } from '#/routes';

import { ChatList, Header as ChatListHeader } from '../../ChatList';
import { SplitViewProvider } from './context';
import { getMessagesSplitViewLayoutDimensions } from './layout-dimensions';

/** layout shared by every message screen: the persistent chat-list column plus the active conversation. */
export function MessagesSplitViewLayout() {
	const { rightNavVisible } = useLayoutBreakpoints();

	if (!rightNavVisible) {
		return <Outlet />;
	}

	return <MessagesSplitViewLayoutInner />;
}

function MessagesSplitViewLayoutInner() {
	const { centerColumnOffset } = useLayoutBreakpoints();
	const newChatHandle = Dialog.useDialogHandle();
	const t = useTheme();
	const { data: chatStatus } = useChatActorStatusQuery();
	const match = useRoute();
	const navigate = useNavigate();

	const onNewChat = (conversation: string) => navigate('MessagesConversation', { conversation });

	const selectedChat =
		(match.name === 'MessagesConversation' || match.name === 'MessagesConversationSettings') &&
		typeof match.params.conversation === 'string'
			? match.params.conversation
			: undefined;

	const { centerColumnWidth, containerWidth, leftColumnWidth } = getMessagesSplitViewLayoutDimensions({
		centerColumnOffset,
	});

	return (
		// fill the shell's center cell exactly (it's sized to this width); the grid centers + offsets the whole
		// column (the minimal nav included), so the split view itself carries no centering or offset.
		<View style={[a.flex_1, a.flex_row, { width: containerWidth }]}>
			<LockScroll />
			<SplitViewProvider side="left">
				<View style={[a.border_l, t.atoms.border_contrast_low, { width: leftColumnWidth }]}>
					<ChatListHeader newChatHandle={newChatHandle} chatStatus={chatStatus} />
					<ChatList newChatHandle={newChatHandle} selectedChat={selectedChat} chatStatus={chatStatus} />
					<NewChatDialog handle={newChatHandle} onNewChat={onNewChat} />
				</View>
			</SplitViewProvider>
			<SplitViewProvider side="right">
				<View style={[a.border_x, t.atoms.border_contrast_low, { width: centerColumnWidth }]}>
					<Outlet />
				</View>
			</SplitViewProvider>
		</View>
	);
}
