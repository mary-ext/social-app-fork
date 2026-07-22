import type { ChatBskyActorDefs } from '@atcute/bluesky';

import { makeProfileLink } from '#/lib/routes/links';

import type { ConvoItem } from '#/state/messages/convo/types';

import { useInviteLinkDialog } from '#/screens/Messages/components/InviteLinkDialogProvider';

import * as Dialog from '#/components/Dialog';
import { getSystemMessageInfo } from '#/components/dms/getSystemMessageInfo';
import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';

import { colors } from '#/styles/colors';

import * as css from './SystemMessageItem.css';

export function SystemMessageItem({
	item,
	relatedProfiles,
}: {
	item: ConvoItem & { type: 'system-message' };
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>;
}) {
	const inviteLinkHandle = useInviteLinkDialog();

	const info = getSystemMessageInfo(item.message.data, relatedProfiles);
	if (!info) {
		return null;
	}

	const { Icon, action } = info;
	const text = info.message;

	const row = (
		<div className={css.row}>
			<Icon className={css.icon} fill={colors.textContrastMedium} size="xs" />
			<Text align="center" color="textContrastMedium" size="xs">
				{text}
			</Text>
		</div>
	);

	switch (action?.kind) {
		case 'profile':
			return (
				<Link className={css.link} label={text} to={makeProfileLink(action.profile)}>
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
