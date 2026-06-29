import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';

import { m } from '#/paraglide/messages';

import { CATEGORIES } from '../categories';
import * as styles from './CategoryNav.css';

/**
 * horizontal strip of category toggles, one per {@link CATEGORIES}. clicking one scrolls the grid to that
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
	return (
		<ToggleGroup
			aria-label={m['components.emojiPicker.category.a11y']()}
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
			{CATEGORIES.map(({ icon: Icon, key, label }) => (
				<Toggle
					aria-label={label()}
					className={styles.navButton}
					disabled={key === 'recent' && !hasRecents}
					key={key}
					value={key}
				>
					<Icon fill="currentColor" size="lg" />
				</Toggle>
			))}
		</ToggleGroup>
	);
}
