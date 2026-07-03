import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { Autocomplete } from '@base-ui/react/autocomplete';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import type { ListRow } from './model';
import * as styles from './ProfileRow.css';

/** a selectable profile row: avatar plus display name and handle. */
export function ProfileRow({ row }: { row: Extract<ListRow, { kind: 'profile' }> }) {
	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts
		? getDisplayRestrictions(moderateProfile(row.profile, moderationOpts), DisplayContext.ProfileMedia)
		: undefined;

	return (
		<Autocomplete.Item className={styles.row} value={row}>
			<UserAvatar
				avatar={row.profile.avatar}
				className={styles.avatar}
				moderation={moderation}
				size={36}
				type={row.profile.associated?.labeler ? 'labeler' : 'user'}
			/>

			<span className={styles.text}>
				<Text numberOfLines={1} weight="medium">
					{row.profile.handle}
				</Text>
				<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
					{row.profile.displayName || row.profile.handle}
				</Text>
			</span>
		</Autocomplete.Item>
	);
}
