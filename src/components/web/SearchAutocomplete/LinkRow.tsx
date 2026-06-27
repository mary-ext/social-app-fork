import { Autocomplete } from '@base-ui/react/autocomplete';

import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './LinkRow.css';
import type { ListRow } from './model';

/** opens a recognised URL in the app. */
export function LinkRow({ row }: { row: Extract<ListRow, { kind: 'link' }> }) {
	return (
		<Autocomplete.Item className={styles.row} value={row}>
			<ChainLinkIcon className={styles.icon} fill="currentColor" size="sm" />
			<Text>{m['components.web.openInApp.label']()}</Text>
		</Autocomplete.Item>
	);
}
