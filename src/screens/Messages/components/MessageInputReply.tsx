import { clsx } from 'clsx';

import { profileDisplayName } from '#/lib/strings/display-names';

import { useConvoActive } from '#/state/messages/convo';

import { useMessageReplies } from '#/components/dms/MessageReplies';
import { getReplyPreviewText } from '#/components/dms/replyPreview';
import { Text } from '#/components/Text';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './MessageInputReply.css';

/**
 * The reply staged in the message composer. Renders a preview of the message being replied to, with a button
 * to cancel the reply.
 */
export function MessageInputReply() {
	const convo = useConvoActive();
	const { replyTo, clearReply } = useMessageReplies();

	if (!replyTo) {
		return null;
	}

	const senderProfile = convo.relatedProfiles.get(replyTo.sender.did);
	const displayName = senderProfile ? profileDisplayName(senderProfile) : null;

	const { subtle, text } = getReplyPreviewText(replyTo);

	return (
		<div className={css.root}>
			<div className={css.textColumn}>
				{displayName && (
					<Text color="textContrastHigh" numberOfLines={1} size="xs">
						{displayName}
					</Text>
				)}
				<Text
					className={clsx(subtle && css.italic)}
					color={subtle ? 'textContrastHigh' : undefined}
					numberOfLines={2}
					size="sm"
				>
					{text}
				</Text>
			</div>
			<button
				aria-label={m['screens.messages.composer.cancelReply']()}
				className={css.cancel}
				onClick={clearReply}
				type="button"
			>
				<XIcon className={css.xIcon} />
			</button>
		</div>
	);
}
