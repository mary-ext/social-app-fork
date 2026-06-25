import { Autocomplete } from '@base-ui/react/autocomplete';

import { sanitizeHandle } from '#/lib/strings/handles';

import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import type { ListRow } from './model';
import * as styles from './ProfileRow.css';

/** a selectable profile row: avatar plus display name and handle. */
export function ProfileRow({ row }: { row: Extract<ListRow, { kind: 'profile' }> }) {
	return (
		<Autocomplete.Item className={styles.row} value={row}>
			<UserAvatar avatar={row.profile.avatar} className={styles.avatar} size={36} type="user" />

			<span className={styles.text}>
				<Text numberOfLines={1} weight="medium">
					{sanitizeHandle(row.profile.handle)}
				</Text>
				<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
					{row.profile.displayName || row.profile.handle}
				</Text>
			</span>
		</Autocomplete.Item>
	);
}
