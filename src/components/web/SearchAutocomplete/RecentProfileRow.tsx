import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';
import { Autocomplete } from '@base-ui/react/autocomplete';

import { sanitizeHandle } from '#/lib/strings/handles';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';
import type { SearchHistoryEntry } from '#/storage';

import type { ListRow } from './model';
import * as styles from './RecentProfileRow.css';
import { RecentRemoveButton } from './RecentRemoveButton';

/** a recent-history profile, with a control to drop it from the stored history. */
export function RecentProfileRow({
	onRemoveRecent,
	row,
}: {
	onRemoveRecent: (entry: SearchHistoryEntry) => void;
	row: Extract<ListRow, { kind: 'recent-profile' }>;
}) {
	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts
		? getDisplayRestrictions(moderateProfile(row.profile, moderationOpts), DisplayContext.ProfileMedia)
		: undefined;

	return (
		<div className={styles.row}>
			<Autocomplete.Item className={styles.item} value={row}>
				<UserAvatar
					avatar={row.profile.avatar}
					className={styles.avatar}
					moderation={moderation}
					size={36}
					type={row.profile.associated?.labeler ? 'labeler' : 'user'}
				/>
				<span className={styles.text}>
					<Text numberOfLines={1} weight="medium">
						{sanitizeHandle(row.profile.handle)}
					</Text>
					<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
						{row.profile.displayName || row.profile.handle}
					</Text>
				</span>
			</Autocomplete.Item>
			<RecentRemoveButton
				label={m['components.web.a11y.removeRecentSearch']({ query: sanitizeHandle(row.profile.handle) })}
				onRemove={() => onRemoveRecent({ did: row.profile.did, kind: 'profile' })}
			/>
		</div>
	);
}
