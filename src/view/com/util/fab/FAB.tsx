import type { ReactNode } from 'react';

import * as css from './FAB.css';

export interface FABProps {
	/** Glyph rendered centered in the button. */
	icon: ReactNode;
	/** Accessible name; becomes the `aria-label`. */
	label: string;
	onClick: () => void;
}

/** Floating compose button, fixed to the bottom-right on narrow viewports and hidden on wider ones. */
export function FAB({ icon, label, onClick }: FABProps) {
	return (
		<button aria-label={label} className={css.fab} onClick={onClick} type="button">
			{icon}
		</button>
	);
}
