import { Autocomplete } from '@base-ui/react/autocomplete';
import { Trans } from '@lingui/react/macro';

import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { Text } from '#/components/Text';

import type { ListRow } from './model';
import * as styles from './SearchRow.css';

/** runs the typed query as a full-text post search. */
export function SearchRow({ row }: { row: Extract<ListRow, { kind: 'search' }> }) {
	return (
		<Autocomplete.Item className={styles.row} value={row}>
			<MagnifyingGlassIcon className={styles.icon} fill="currentColor" size="sm" />
			<Text className={styles.label}>
				<Trans>
					Search for <Text weight="semiBold">{row.query}</Text>
				</Trans>
			</Text>
		</Autocomplete.Item>
	);
}
