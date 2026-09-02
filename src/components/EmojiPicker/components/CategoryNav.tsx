import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';

import { m } from '#/paraglide/messages';

import { CATEGORIES } from '../categories';
import * as styles from './CategoryNav.css';

/** category navigation that preserves focus in the search input. */
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
					onMouseDown={(event) => event.preventDefault()}
					value={key}
				>
					<Icon className={styles.navIcon} />
				</Toggle>
			))}
		</ToggleGroup>
	);
}
