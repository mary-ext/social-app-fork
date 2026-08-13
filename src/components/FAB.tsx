'use no memo'; // compiler output is duplicated across lazy chunks and outweighs these thin wrappers

import type { ComponentPropsWithRef, ComponentType, SVGProps } from 'react';

import { clsx } from 'clsx';

import * as css from './FAB.css';

export interface FABProps extends ComponentPropsWithRef<'button'> {
	/** Glyph centered in the button; sized and tinted by the button itself. */
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	/** Accessible name; becomes the `aria-label`. */
	label: string;
}

/**
 * Floating compose button, fixed to the bottom-right on narrow viewports and hidden on wider ones. Forwards
 * arbitrary button props and its ref so it can back a `Dialog.Trigger`.
 */
export function FAB({ className, icon: Icon, label, ...props }: FABProps) {
	return (
		<button aria-label={label} className={clsx(css.fab, className)} type="button" {...props}>
			<Icon className={css.fabIcon} />
		</button>
	);
}
