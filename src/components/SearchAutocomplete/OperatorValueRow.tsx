import { Autocomplete } from '@base-ui/react/autocomplete';

import type { OperatorName } from '#/lib/bsky/search';

import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import type { ListRow } from './model';
import * as styles from './OperatorRow.css';

/** the human-readable description for a fixed `op:value` filter (`has:media`, `from:following`). */
const valueLabel = (op: OperatorName, value: string): string | undefined => {
	switch (`${op}:${value}`) {
		case 'from:following':
			return m['components.web.search.operator.following']();
		case 'has:media':
			return m['components.web.search.operator.media']();
		case 'has:video':
			return m['components.web.search.operator.video']();
		case 'replies:none':
			return m['components.web.search.operator.repliesNone']();
		case 'replies:only':
			return m['components.web.search.operator.repliesOnly']();
		default:
			return undefined;
	}
};

/** a completed `op:value` filter suggestion (e.g. `has:media`, `from:following`). */
export function OperatorValueRow({ row }: { row: Extract<ListRow, { kind: 'operator-value' }> }) {
	const label = valueLabel(row.op, row.value);

	return (
		<Autocomplete.Item className={styles.row} value={row}>
			<Text>
				<Text weight="medium">
					{row.op}:{row.value}
				</Text>
				{label !== undefined && <Text color="textContrastMedium"> — {label}</Text>}
			</Text>
		</Autocomplete.Item>
	);
}
