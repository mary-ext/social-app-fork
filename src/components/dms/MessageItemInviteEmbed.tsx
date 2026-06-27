import { View } from 'react-native';
import type { ChatBskyEmbedJoinLink } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';

import { useConvoActive } from '#/state/messages/convo';

import { atoms as a, useTheme } from '#/alf';

import * as ChatInvite from '#/components/dms/ChatInvite';

import { MessageContextProvider } from './MessageContext';
import * as css from './MessageItemInviteEmbed.css';

const BORDER_RADIUS = 20;
const SQUARED_BORDER_RADIUS = 4;

function MessageItemInviteEmbed({
	embed,
	isFromSelf,
	isGroupChat,
	squaredTopCorner,
	squaredBottomCorner,
}: {
	embed: $type.enforce<ChatBskyEmbedJoinLink.View>;
	isFromSelf: boolean;
	isGroupChat: boolean;
	squaredTopCorner: boolean;
	squaredBottomCorner: boolean;
}): React.ReactNode {
	const t = useTheme();
	const convo = useConvoActive();
	const { status, preview, action } = ChatInvite.useChatInvite({
		code: embed.joinLinkPreview.code,
		initialPreview: embed.joinLinkPreview,
		currentConvoId: convo.convo.view.id,
	});

	return (
		<MessageContextProvider>
			<View
				style={[
					!isFromSelf && isGroupChat && a.ml_sm,
					{
						width: '100%',
						minWidth: 280,
						maxWidth: 360,
					},
				]}
			>
				<View
					style={[
						a.p_md,
						a.gap_md,
						a.overflow_hidden,
						isFromSelf
							? {
									backgroundColor: t.palette.primary_50,
									borderBottomRightRadius: squaredBottomCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS,
									borderTopRightRadius: squaredTopCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS,
									borderBottomLeftRadius: BORDER_RADIUS,
									borderTopLeftRadius: BORDER_RADIUS,
								}
							: {
									backgroundColor: t.palette.contrast_50,
									borderBottomLeftRadius: squaredBottomCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS,
									borderTopLeftRadius: squaredTopCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS,
									borderBottomRightRadius: BORDER_RADIUS,
									borderTopRightRadius: BORDER_RADIUS,
								},
					]}
				>
					<MessageItemInviteEmbedBody status={status} preview={preview} action={action} />
				</View>
			</View>
		</MessageContextProvider>
	);
}
export { MessageItemInviteEmbed };

function MessageItemInviteEmbedBody({
	status,
	preview,
	action,
}: {
	status: ChatInvite.ChatInviteStatus;
	preview: ChatInvite.ChatInvitePreview | undefined;
	action: ChatInvite.ChatInviteAction | undefined;
}) {
	if (status === 'loading') {
		return <ChatInvite.Loading className={css.loadingPad} />;
	}

	if (status !== 'available') {
		return <ChatInvite.Unavailable className={css.errorPad} />;
	}

	return (
		<>
			<ChatInvite.Card preview={preview} />
			<ChatInvite.JoinButton action={action} />
		</>
	);
}
