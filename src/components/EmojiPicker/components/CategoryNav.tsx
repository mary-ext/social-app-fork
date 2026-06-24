import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useLingui } from '@lingui/react/macro';

import { CATEGORY_ICONS, CATEGORY_KEYS, useCategoryLabel } from '../categories';
import * as styles from './CategoryNav.css';

/**
 * horizontal strip of category toggles, one per {@link CATEGORY_KEYS}. clicking one scrolls the grid to that
 * section; the toggle for the section currently scrolled into view shows as pressed. the `recent` toggle is
 * disabled until {@link hasRecents}.
 */
export function CategoryNav({
	active,
	hasRecents,
	onJump,
}: {
	active: string | null;
	hasRecents: boolean;
	onJump: (key: string) => void;
}) {
	const { t } = useLingui();
	const labelFor = useCategoryLabel();

	return (
		<ToggleGroup
			aria-label={t`Emoji categories`}
			className={styles.nav}
			onValueChange={(groupValue) => {
				const next = groupValue[0];
				if (next && next !== active) {
					onJump(next);
				}
			}}
			render={<nav />}
			value={active ? [active] : []}
		>
			{CATEGORY_KEYS.map((key) => {
				const Icon = CATEGORY_ICONS[key];
				return (
					<Toggle
						aria-label={labelFor(key)}
						className={styles.navButton}
						disabled={key === 'recent' && !hasRecents}
						key={key}
						value={key}
					>
						<Icon fill="currentColor" width={20} />
					</Toggle>
				);
			})}
		</ToggleGroup>
	);
}
