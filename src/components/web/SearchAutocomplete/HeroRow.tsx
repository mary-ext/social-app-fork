import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './HeroRow.css';

/** the empty-state hero shown when nothing actionable precedes the operator options. */
export function HeroRow() {
	return (
		<div className={styles.hero}>
			<MagnifyingGlassIcon className={styles.icon} fill="currentColor" size="xl" />
			<Text className={styles.text} color="textContrastMedium">
				{m['components.web.search.placeholder']()}
			</Text>
		</div>
	);
}
