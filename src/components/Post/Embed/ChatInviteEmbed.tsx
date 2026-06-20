import type { AppBskyEmbedExternal } from '@atcute/bluesky';

import * as ChatInvite from '#/components/dms/ChatInvite';
import { ExternalEmbed } from '#/components/ExternalEmbed';
import { JoinRequestEmbedBody } from '#/components/Post/Embed/JoinRequestEmbed';

import * as css from './ChatInviteEmbed.css';

/**
 * Renders a chat invite link found in an `app.bsky.embed.external` embed (e.g. a `bsky.app/chat/<code>` link
 * posted to the feed) as a join request card, falling back to a plain external embed if the invite can't be
 * resolved.
 */
export function ChatInviteEmbed({
	code,
	link,
	onOpen,
}: {
	code: string;
	link: AppBskyEmbedExternal.ViewExternal;
	onOpen?: () => void;
}) {
	const { status, preview, action, joinDialog } = ChatInvite.useChatInvite({ code });

	if (status === 'error') {
		return <ExternalEmbed link={link} onOpen={onOpen} className={css.spacing} />;
	}

	return (
		<>
			<JoinRequestEmbedBody
				status={status}
				preview={preview}
				action={action}
				onOpen={onOpen}
				className={css.spacing}
			/>
			{joinDialog}
		</>
	);
}
