import { clsx } from 'clsx';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { useConvoActive } from '#/state/messages/convo';

import { useMessageReplies } from '#/components/dms/MessageReplies';
import { getReplyPreviewText } from '#/components/dms/replyPreview';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

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
	const displayName = senderProfile ? createSanitizedDisplayName(senderProfile, false) : null;

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
				<XIcon fill={colors.textContrastHigh} size="xs" />
			</button>
		</div>
	);
}
