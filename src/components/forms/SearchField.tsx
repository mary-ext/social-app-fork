'use no memo'; // controlled input updates usually invalidate the generated caches

import { type ComponentPropsWithRef, type MouseEvent, type ReactNode, type Ref, useRef } from 'react';

import { clsx } from 'clsx';

import { mergeRefs } from '#/lib/utils/merge-refs';

import * as styles from '#/components/forms/SearchField.css';
import { Button, ButtonIcon } from '#/components/web/Button';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';

// clicks landing on one of these are handled by the element itself; the field must not steal them to refocus
// the input. `input`/`textarea` are listed so a direct click keeps native caret placement.
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [role="link"]';

export type SearchFieldShape = keyof typeof styles.shape;

export type SearchFieldSize = keyof typeof styles.size;

/**
 * search field container. clicking outside its interactive controls focuses the input.
 *
 * @param shape `default` for rounded corners; `round` for a pill shape
 * @param size `default` for standard spacing; `small` for compact spacing
 */
export function Root({
	children,
	className,
	ref,
	shape = 'default',
	size = 'default',
}: {
	children: ReactNode;
	className?: string;
	ref?: Ref<HTMLDivElement>;
	shape?: SearchFieldShape;
	size?: SearchFieldSize;
}) {
	const innerRef = useRef<HTMLDivElement>(null);
	// the input no longer fills the box, so restore "click anywhere to focus" over the padding and the
	// non-interactive icon. mousedown (not click) so focus lands before a selection can start and without a
	// flicker; preventDefault keeps the click from moving focus off the input we're about to focus.
	const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
		const target = event.target;
		if (event.defaultPrevented || !(target instanceof Element) || target.closest(INTERACTIVE_SELECTOR)) {
			return;
		}
		event.preventDefault();
		innerRef.current?.querySelector<HTMLElement>('input, textarea')?.focus();
	};

	return (
		<div
			className={clsx(styles.field, styles.shape[shape], styles.size[size], className)}
			onMouseDown={onMouseDown}
			ref={mergeRefs([innerRef, ref])}
		>
			{children}
		</div>
	);
}

/** leading, non-interactive magnifying-glass icon. */
export function Icon() {
	return <MagnifyingGlassIcon className={styles.icon} />;
}

/**
 * the styled field input. render it directly, or via a Base UI input's `render` prop to inherit the shared
 * styling.
 */
export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
	return <input type="text" {...props} className={clsx(styles.input, className)} />;
}

/**
 * trailing clear button (×); out of the tab order since keyboard users clear by editing. usable standalone
 * (pass `onClick`) or as a Base UI `render` target (e.g. `<Autocomplete.Clear render={<Clear label={…}
 * />}>`), which injects the press/visibility behavior. `children` is fixed to the × icon.
 *
 * @param label accessible name
 */
export function Clear({
	className,
	label,
	...props
}: { label: string } & Omit<ComponentPropsWithRef<'button'>, 'children' | 'color'>) {
	return (
		<Button
			className={clsx(styles.clear, className)}
			color="secondary"
			label={label}
			shape="round"
			size="tiny"
			tabIndex={-1}
			variant="ghost"
			{...props}
		>
			<ButtonIcon icon={XIcon} size="xs" />
		</Button>
	);
}

/** trailing container grouping several controls (e.g. a {@link Clear} beside a persistent accessory). */
export function Slot({ children }: { children: ReactNode }) {
	return <div className={styles.slot}>{children}</div>;
}
