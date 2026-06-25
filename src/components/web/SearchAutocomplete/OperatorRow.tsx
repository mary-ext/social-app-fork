import { Autocomplete } from '@base-ui/react/autocomplete';

import { Text } from '#/components/Text';

import type { ListRow } from './model';
import * as styles from './OperatorRow.css';

/** a search operator hint (e.g. `from:`) offered under the search options. */
export function OperatorRow({ row }: { row: Extract<ListRow, { kind: 'operator' }> }) {
	return (
		<Autocomplete.Item className={styles.row} value={row}>
			<Text>
				<Text weight="medium">{row.operator.name}</Text>
				<Text>: </Text>
				<Text color="textContrastMedium">{row.operator.placeholder}</Text>
			</Text>
		</Autocomplete.Item>
	);
}
