import { View } from 'react-native';

import { HITSLOP_20 } from '#/lib/constants';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { useConvoActive } from '#/state/messages/convo';

import { atoms as a, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import { useMessageReplies } from '#/components/dms/MessageReplies';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

/**
 * The reply staged in the message composer. Renders a preview of the message being replied to, with a button
 * to cancel the reply.
 */
export function MessageInputReply() {
	const t = useTheme();
	const convo = useConvoActive();
	const { replyTo, clearReply } = useMessageReplies();

	if (!replyTo) {
		return null;
	}

	const senderProfile = convo.relatedProfiles.get(replyTo.sender.did);
	const displayName = senderProfile ? createSanitizedDisplayName(senderProfile, false) : null;

	let text = replyTo.text;
	let subtle = false;
	if (!text.trim()) {
		subtle = true;
		if (replyTo.embed?.$type === 'chat.bsky.embed.joinLink#view') {
			text = m['common.label.chatInviteLink']();
		} else if (replyTo.embed?.$type === 'app.bsky.embed.record#view') {
			text = m['common.label.embeddedContent']();
		} else {
			text = m['common.label.noText']();
		}
	}

	return (
		<View
			style={[
				a.flex_1,
				a.flex_row,
				a.gap_sm,
				a.align_start,
				t.atoms.border_contrast_high,
				a.rounded_md,
				a.border,
				a.p_sm,
				a.mt_sm,
				a.mx_sm,
				a.gap_2xs,
			]}
		>
			<View style={[a.flex_1]}>
				{displayName && (
					<Text style={[a.text_xs, t.atoms.text_contrast_high]} emoji numberOfLines={1}>
						{displayName}
					</Text>
				)}
				<Text style={[a.text_sm, subtle && [a.italic, t.atoms.text_contrast_high]]} emoji numberOfLines={2}>
					{text}
				</Text>
			</View>
			<Button
				label={m['screens.messages.action.cancelReply']()}
				onPress={clearReply}
				style={[a.px_2xs]}
				hitSlop={HITSLOP_20}
			>
				<XIcon size="xs" style={t.atoms.text_contrast_high} />
			</Button>
		</View>
	);
}
