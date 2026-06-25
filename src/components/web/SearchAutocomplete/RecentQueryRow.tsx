import { Autocomplete } from '@base-ui/react/autocomplete';
import { useLingui } from '@lingui/react/macro';

import { Clock_Stroke2_Corner0_Rounded as ClockIcon } from '#/components/icons/Clock';
import { Text } from '#/components/Text';

import type { SearchHistoryEntry } from '#/storage';

import type { ListRow } from './model';
import * as styles from './RecentQueryRow.css';
import { RecentRemoveButton } from './RecentRemoveButton';

/** a recent-history search query, with a control to drop it from the stored history. */
export function RecentQueryRow({
	onRemoveRecent,
	row,
}: {
	onRemoveRecent: (entry: SearchHistoryEntry) => void;
	row: Extract<ListRow, { kind: 'recent-query' }>;
}) {
	const { t } = useLingui();

	return (
		<div className={styles.row}>
			<Autocomplete.Item className={styles.item} value={row}>
				<ClockIcon className={styles.icon} fill="currentColor" size="sm" />
				<Text className={styles.label}>{row.query}</Text>
			</Autocomplete.Item>
			<RecentRemoveButton
				label={t`Remove ${row.query} from recent searches`}
				onRemove={() => onRemoveRecent({ kind: 'query', query: row.query })}
			/>
		</div>
	);
}
