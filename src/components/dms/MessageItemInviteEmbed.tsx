import type { ChatBskyEmbedJoinLink } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';

import { useConvoActive } from '#/state/messages/convo';

import * as ChatInvite from '#/components/dms/ChatInvite';

import { MessageContextProvider } from './MessageContext';
import { cornerRadii } from './MessageItemEmbed';
import * as css from './MessageItemInviteEmbed.css';

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
	const convo = useConvoActive();
	const { status, preview, action } = ChatInvite.useChatInvite({
		code: embed.joinLinkPreview.code,
		initialPreview: embed.joinLinkPreview,
		currentConvoId: convo.convo.view.id,
	});

	return (
		<MessageContextProvider>
			<div className={css.outer({ indent: !isFromSelf && isGroupChat })}>
				<div
					className={css.inner({ fromSelf: isFromSelf })}
					style={cornerRadii({ isFromSelf, squaredBottomCorner, squaredTopCorner })}
				>
					<MessageItemInviteEmbedBody action={action} preview={preview} status={status} />
				</div>
			</div>
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
