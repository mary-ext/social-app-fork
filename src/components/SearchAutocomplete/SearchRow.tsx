import { Autocomplete } from '@base-ui/react/autocomplete';

import { Trans } from '#/locale/Trans';

import { Text } from '#/components/Text';

import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import type { ListRow } from './model';
import * as styles from './SearchRow.css';

/** runs the typed query as a full-text post search. */
export function SearchRow({ row }: { row: Extract<ListRow, { kind: 'search' }> }) {
	return (
		<Autocomplete.Item className={styles.row} value={row}>
			<MagnifyingGlassIcon className={styles.icon} />
			<Text className={styles.label}>
				<Trans
					message={m['components.web.search.submit']}
					inputs={{ query: row.query }}
					markup={{ t0: ({ children }) => <Text weight="semiBold">{children}</Text> }}
				/>
			</Text>
		</Autocomplete.Item>
	);
}
