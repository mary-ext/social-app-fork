import { Autocomplete } from '@base-ui/react/autocomplete';

import { Trans } from '#/locale/Trans';

import { At_Stroke2_Corner0_Rounded as AtIcon } from '#/components/icons/At';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './GotoRow.css';
import type { ListRow } from './model';

/** a shortcut that opens the profile resolved from a handle or DID typed into the query. */
export function GotoRow({ row }: { row: Extract<ListRow, { kind: 'goto' }> }) {
	return (
		<Autocomplete.Item className={styles.row} value={row}>
			<AtIcon className={styles.icon} fill="currentColor" size="sm" />
			<Text className={styles.label}>
				<Trans
					message={m['components.web.action.goTo']}
					inputs={{ name: row.name }}
					markup={{ t0: ({ children }) => <Text weight="medium">{children}</Text> }}
				/>
			</Text>
		</Autocomplete.Item>
	);
}
