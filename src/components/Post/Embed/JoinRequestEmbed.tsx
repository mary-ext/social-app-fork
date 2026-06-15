import { clsx } from 'clsx';

import * as ChatInvite from '#/components/dms/ChatInvite';

import * as css from './JoinRequestEmbed.css';

/**
 * The "join request" presentation of a chat invite, used as a post embed: the loading / no-longer-available /
 * card + join button states. The caller owns resolving the invite (via {@link ChatInvite.useChatInvite}) and
 * passes the derived state in, so it can fall back to a plain link on error.
 */
export function JoinRequestEmbedBody({
	status,
	preview,
	action,
	className,
	onOpen,
}: {
	status: ChatInvite.ChatInviteStatus;
	preview: ChatInvite.ChatInvitePreview | undefined;
	action: ChatInvite.ChatInviteAction | undefined;
	className?: string;
	onOpen?: () => void;
}) {
	if (status === 'loading') {
		return <ChatInvite.Loading className={clsx(css.box, className)} />;
	}

	if (status !== 'available') {
		return <ChatInvite.Unavailable className={clsx(css.box, className)} />;
	}

	return (
		<div className={clsx(css.box, css.available, className)}>
			<ChatInvite.Card preview={preview} />
			<ChatInvite.JoinButton action={action} onPress={onOpen} />
		</div>
	);
}
