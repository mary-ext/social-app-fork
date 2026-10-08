import { Text } from '#/components/Text';

import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './HeroRow.css';

/** the empty-state hero shown when nothing actionable precedes the operator options. */
export function HeroRow() {
	return (
		<div className={styles.hero}>
			<MagnifyingGlassIcon className={styles.icon} />
			<Text className={styles.text} color="textContrastMedium">
				{m['components.web.search.placeholder']()}
			</Text>
		</div>
	);
}
