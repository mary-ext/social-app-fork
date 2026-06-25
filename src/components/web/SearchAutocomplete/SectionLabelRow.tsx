import { useLingui } from '@lingui/react/macro';

import { Text } from '#/components/Text';

import type { ListRow } from './model';
import * as styles from './SectionLabelRow.css';

/** an uppercase heading that groups the rows beneath it (e.g. "Recent", "Search options"). */
export function SectionLabelRow({ row }: { row: Extract<ListRow, { kind: 'section-label' }> }) {
	const { i18n } = useLingui();

	return (
		<Text className={styles.label} color="textContrastMedium">
			{i18n._(row.label)}
		</Text>
	);
}
