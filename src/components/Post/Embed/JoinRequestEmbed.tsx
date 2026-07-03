import { clsx } from 'clsx';

import * as ChatInvite from '#/components/dms/ChatInvite';

import * as css from './JoinRequestEmbed.css';

/**
 * presentation of a chat invite join request used as a post embed. displays loading, unavailable, or card and
 * join button states.
 *
 * @param invite the resolved invite or error state
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
