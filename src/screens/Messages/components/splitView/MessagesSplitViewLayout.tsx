import { View } from 'react-native';

import { type ScreenLayoutArgs, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { FlatNavigatorParams, NativeStackNavigationOptionsWithAuth } from '#/lib/routes/types';

import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';

import { atoms as a, useLayoutBreakpoints, useTheme } from '#/alf';

import { NewChatDialog } from '#/components/dms/dialogs/NewChatDialog';
import { LockScroll } from '#/components/LockScroll';
import * as Dialog from '#/components/web/Dialog';

import { ChatList, Header as ChatListHeader } from '../../ChatList';
import { SplitViewProvider } from './context';
import { getMessagesSplitViewLayoutDimensions } from './layout-dimensions';

type MessageScreens =
	| 'Messages'
	| 'MessagesConversation'
	| 'MessagesConversationSettings'
	| 'MessagesInbox'
	| 'MessagesJoinRequests'
	| 'MessagesSettings';

type LayoutProps = ScreenLayoutArgs<
	FlatNavigatorParams,
	MessageScreens,
	NativeStackNavigationOptionsWithAuth,
	NativeStackNavigationProp<FlatNavigatorParams, MessageScreens, string | undefined>
>;
export function renderMessagesSplitViewLayout(props: LayoutProps) {
	return <MessagesSplitViewLayout {...props} />;
}

export function MessagesSplitViewLayout({ children, ...props }: LayoutProps) {
	const { rightNavVisible } = useLayoutBreakpoints();

	if (!rightNavVisible) {
		return children;
	}

	return <MessagesSplitViewLayoutInner {...props}>{children}</MessagesSplitViewLayoutInner>;
}

function MessagesSplitViewLayoutInner({ children, navigation, route }: LayoutProps) {
	const { centerColumnOffset } = useLayoutBreakpoints();
	const newChatHandle = Dialog.useDialogHandle();
	const t = useTheme();
	const isFocused = useIsFocused();
	const { data: chatStatus } = useChatActorStatusQuery();

	const onNewChat = (conversation: string) => navigation.navigate('MessagesConversation', { conversation });

	const selectedChat =
		(route.name === 'MessagesConversation' || route.name === 'MessagesConversationSettings') &&
		route.params &&
		'conversation' in route.params
			? route.params.conversation
			: undefined;

	const { centerColumnWidth, containerWidth, leftColumnWidth } = getMessagesSplitViewLayoutDimensions({
		centerColumnOffset,
	});

	return (
		// fill the shell's center cell exactly (it's sized to this width); the grid centers + offsets the whole
		// column (the minimal nav included), so the split view itself carries no centering or offset.
		<View style={[a.flex_1, a.flex_row, { width: containerWidth }]}>
			{isFocused && <LockScroll />}
			<SplitViewProvider side="left">
				<View style={[a.border_l, t.atoms.border_contrast_low, { width: leftColumnWidth }]}>
					<ChatListHeader newChatHandle={newChatHandle} chatStatus={chatStatus} />
					<ChatList newChatHandle={newChatHandle} selectedChat={selectedChat} chatStatus={chatStatus} />
					<NewChatDialog handle={newChatHandle} onNewChat={onNewChat} />
				</View>
			</SplitViewProvider>
			<SplitViewProvider side="right">
				<View style={[a.border_x, t.atoms.border_contrast_low, { width: centerColumnWidth }]}>
					{children}
				</View>
			</SplitViewProvider>
		</View>
	);
}
