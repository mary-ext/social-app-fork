import { Autocomplete } from '@base-ui/react/autocomplete';

import { Text } from '#/components/Text';

import ChainLinkIcon from '#/icons/central/ChainLink3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './LinkRow.css';
import type { ListRow } from './model';

/** opens a recognised URL in the app. */
export function LinkRow({ row }: { row: Extract<ListRow, { kind: 'link' }> }) {
	return (
		<Autocomplete.Item className={styles.row} value={row}>
			<ChainLinkIcon className={styles.icon} />
			<Text>{m['components.web.openInApp.label']()}</Text>
		</Autocomplete.Item>
	);
}
