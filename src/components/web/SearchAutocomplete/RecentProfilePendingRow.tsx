import { useLingui } from '@lingui/react/macro';

import * as Skeleton from '#/components/web/Skeleton';

import type { SearchHistoryEntry } from '#/storage';

import type { ListRow } from './model';
import * as styles from './RecentProfilePendingRow.css';
import { RecentRemoveButton } from './RecentRemoveButton';

/** holds a recent profile's slot with a skeleton while its view is still hydrating. */
export function RecentProfilePendingRow({
	onRemoveRecent,
	row,
}: {
	onRemoveRecent: (entry: SearchHistoryEntry) => void;
	row: Extract<ListRow, { kind: 'recent-profile-pending' }>;
}) {
	const { t } = useLingui();

	return (
		<div className={styles.row}>
			<div className={styles.item}>
				<div className={styles.avatar}>
					<Skeleton.Circle size={36} />
				</div>
				<span className={styles.text}>
					<Skeleton.Text size="md" width={140} />
					<Skeleton.Text blend size="md_sub" width={90} />
				</span>
			</div>
			<RecentRemoveButton
				label={t`Remove from recent searches`}
				onRemove={() => onRemoveRecent({ did: row.did, kind: 'profile' })}
			/>
		</div>
	);
}
