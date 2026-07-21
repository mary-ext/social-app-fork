import { View } from 'react-native';

import type { ChatBskyActorDefs } from '@atcute/bluesky';

import { makeProfileLink } from '#/lib/routes/links';

import type { ConvoItem } from '#/state/messages/convo/types';

import { useInviteLinkDialog } from '#/screens/Messages/components/InviteLinkDialogProvider';

import { atoms as a, useTheme } from '#/alf';

import * as Dialog from '#/components/Dialog';
import { getSystemMessageInfo } from '#/components/dms/getSystemMessageInfo';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './SystemMessageItem.css';

export function SystemMessageItem({
	item,
	relatedProfiles,
}: {
	item: ConvoItem & { type: 'system-message' };
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>;
}) {
	const t = useTheme();
	const inviteLinkHandle = useInviteLinkDialog();

	const info = getSystemMessageInfo(item.message.data, relatedProfiles);
	if (!info) {
		return null;
	}

	const { Icon, action } = info;
	const text = info.message;

	const row = (
		<View style={[a.w_full, a.flex_row, a.align_center, a.justify_center, a.px_md, a.mt_md]}>
			<Icon size="xs" fill={colors.textContrastMedium} className={css.icon} />
			<Text
				style={[
					a.text_xs,
					a.text_center,
					t.atoms.text_contrast_medium,
					{ includeFontPadding: false, textAlignVertical: 'center' },
				]}
			>
				{text}
			</Text>
		</View>
	);

	switch (action?.kind) {
		case 'profile':
			return (
				<Link
					to={makeProfileLink(action.profile)}
					label={text}
					accessibilityHint={m['components.dms.message.a11y.opensProfile']()}
					style={a.w_full}
				>
					{row}
				</Link>
			);
		case 'inviteLink':
			if (!inviteLinkHandle) {
				return row;
			}
			return (
				<Dialog.Trigger aria-label={text} className={css.button} handle={inviteLinkHandle} type="button">
					{row}
				</Dialog.Trigger>
			);
		default:
			return row;
	}
}
