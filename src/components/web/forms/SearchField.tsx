import { type ComponentPropsWithRef, type MouseEvent, type ReactNode, type Ref, useRef } from 'react';

import { clsx } from 'clsx';

import { mergeRefs } from '#/lib/merge-refs';

import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as styles from '#/components/web/forms/SearchField.css';

// clicks landing on one of these are handled by the element itself; the field must not steal them to refocus
// the input. `input`/`textarea` are listed so a direct click keeps native caret placement.
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [role="link"]';

/**
 * search-field chrome: a flex container laying out a leading {@link Icon}, the {@link Input}, and trailing
 * controls ({@link Clear} and/or a {@link Slot}). clicking anywhere on the box that isn't an interactive
 * control focuses the input.
 */
export function Root({
	children,
	className,
	ref,
}: {
	children: ReactNode;
	className?: string;
	ref?: Ref<HTMLDivElement>;
}) {
	const innerRef = useRef<HTMLDivElement>(null);
	// the input no longer fills the box, so restore "click anywhere to focus" over the padding and the
	// non-interactive icon. mousedown (not click) so focus lands before a selection can start and without a
	// flicker; preventDefault keeps the click from moving focus off the input we're about to focus.
	const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
		if (event.defaultPrevented || (event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) {
			return;
		}
		event.preventDefault();
		innerRef.current?.querySelector<HTMLElement>('input, textarea')?.focus();
	};

	return (
		<div className={clsx(styles.field, className)} onMouseDown={onMouseDown} ref={mergeRefs([innerRef, ref])}>
			{children}
		</div>
	);
}

/** leading, non-interactive magnifying-glass icon. */
export function Icon() {
	return <MagnifyingGlassIcon className={styles.icon} size="lg" fill="currentColor" />;
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
