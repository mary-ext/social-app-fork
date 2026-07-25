import type { ComponentPropsWithRef, ReactNode } from 'react';

import { clsx } from 'clsx';

import * as css from './FAB.css';

export interface FABProps extends ComponentPropsWithRef<'button'> {
	/** Glyph rendered centered in the button. */
	icon: ReactNode;
	/** Accessible name; becomes the `aria-label`. */
	label: string;
}

/**
 * Floating compose button, fixed to the bottom-right on narrow viewports and hidden on wider ones. Forwards
 * arbitrary button props and its ref so it can back a `Dialog.Trigger`.
 */
export function FAB({ className, icon, label, ...props }: FABProps) {
	return (
		<button aria-label={label} className={clsx(css.fab, className)} type="button" {...props}>
			{icon}
		</button>
	);
}
