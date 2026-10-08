'use no memo'; // controlled input updates usually invalidate the generated caches

import { type ComponentPropsWithRef, type MouseEvent, type ReactNode, type Ref, useRef } from 'react';

import { clsx } from 'clsx';

import { INTERACTIVE_SELECTOR } from '#/lib/browser/interactive';
import { mergeRefs } from '#/lib/utils/merge-refs';

import * as styles from '#/components/forms/SearchField.css';
import { Button, ButtonIcon } from '#/components/web/Button';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';

// preserve native caret placement when clicking directly on inputs.
const OWN_PRESS_SELECTOR = `${INTERACTIVE_SELECTOR}, input, select, textarea`;

/** `default` has rounded corners; `round` is pill-shaped. */
export type SearchFieldShape = keyof typeof styles.shape;

/** `default` uses standard spacing; `small` is compact. */
export type SearchFieldSize = keyof typeof styles.size;

/**
 * search field container. clicking outside its interactive controls focuses the input.
 *
 * @param shape field corner shape
 * @param size field size preset
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
		// portal events bubble through React without being inside the field's DOM subtree.
		if (
			event.defaultPrevented ||
			!(target instanceof Element) ||
			!event.currentTarget.contains(target) ||
			target.closest(OWN_PRESS_SELECTOR)
		) {
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

/** styled search input. */
export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
	return <input type="text" {...props} className={clsx(styles.input, className)} />;
}

/**
 * search-field button for opening a separate search UI.
 *
 * @param placeholder text shown when `value` is empty
 * @param shape field corner shape
 * @param size field size preset
 * @param value query text to display
 * @param valueRef span containing only the query text; absent when empty
 * @returns the trigger button
 */
export function Trigger({
	className,
	placeholder,
	shape = 'default',
	size = 'default',
	value,
	valueRef,
	...props
}: {
	placeholder: string;
	shape?: SearchFieldShape;
	size?: SearchFieldSize;
	value: string;
	valueRef?: Ref<HTMLSpanElement>;
} & Omit<ComponentPropsWithRef<'button'>, 'children' | 'value'>) {
	return (
		<button
			type="button"
			{...props}
			className={clsx(styles.field, styles.shape[shape], styles.size[size], styles.trigger, className)}
		>
			<Icon />
			{value ? (
				<span className={styles.value} ref={valueRef}>
					{value}
				</span>
			) : (
				<span className={clsx(styles.value, styles.placeholder)}>{placeholder}</span>
			)}
		</button>
	);
}

/**
 * trailing clear button; excluded from the tab order.
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
