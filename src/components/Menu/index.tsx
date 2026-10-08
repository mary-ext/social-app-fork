'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ComponentType, ReactElement, ReactNode, SVGProps } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { useConstant } from '#/lib/hooks/use-constant';

import * as styles from '#/components/Menu/Menu.css';
import * as BaseMenu from '#/components/primitives/menu';
import { Text } from '#/components/Text';

import CheckmarkIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke3.svg';

export const Root = BaseMenu.Root;
export const Trigger = BaseMenu.Trigger;
export const Group = BaseMenu.Group;

export const createHandle = BaseMenu.createHandle;

export type MenuHandle = BaseMenu.Handle;

/** @returns a menu handle stable for the component's lifetime */
export function useMenuHandle(): MenuHandle {
	const handle = useConstant(createHandle);
	return handle;
}

/**
 * renders a styled menu popup.
 *
 * @param props menu content and placement
 * @returns the popup
 */
export function Popup({
	children,
	label,
	align = 'start',
	side = 'bottom',
	minWidth,
}: {
	children: ReactNode;
	/** accessible name; defaults to the trigger's name. */
	label?: string;
	align?: BaseMenu.PositionerProps['align'];
	side?: BaseMenu.PositionerProps['side'];
	/** minimum popup width, in pixels. */
	minWidth?: number;
}) {
	return (
		<BaseMenu.Positioner align={align} side={side} sideOffset={5}>
			<BaseMenu.Popup
				aria-label={label}
				className={styles.popup}
				style={
					minWidth !== undefined ? assignInlineVars({ [styles.minWidthVar]: `${minWidth}px` }) : undefined
				}
			>
				{children}
			</BaseMenu.Popup>
		</BaseMenu.Positioner>
	);
}

export function Item({
	children,
	label,
	onClick,
	onMouseEnter,
	destructive = false,
	disabled,
	render,
}: {
	children: ReactNode;
	/** Overrides the label used for keyboard typeahead (defaults to the item's text). */
	label?: string;
	onClick?: () => void;
	/** Hover hook, e.g. to prefetch the data a dialog opened by the item will need. */
	onMouseEnter?: () => void;
	destructive?: boolean;
	disabled?: boolean;
	/** renders the item as a custom element, keeping menu-item styling, keyboard navigation, and close-on-click */
	render?: ReactElement;
}) {
	return (
		<BaseMenu.Item
			className={clsx(styles.item, destructive && styles.itemDestructive)}
			label={label}
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			disabled={disabled}
			render={render}
		>
			{children}
		</BaseMenu.Item>
	);
}

/**
 * renders a menu checkbox without closing the menu.
 *
 * @param props the item props
 * @returns the checkbox item
 */
export function CheckboxItem({
	children,
	label,
	checked,
	onCheckedChange,
	disabled,
}: {
	children: ReactNode;
	label?: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<BaseMenu.CheckboxItem
			className={styles.item}
			label={label}
			checked={checked}
			onCheckedChange={onCheckedChange}
			disabled={disabled}
		>
			{children}
		</BaseMenu.CheckboxItem>
	);
}

/** @returns a checkbox indicator */
export function ItemCheckbox() {
	return (
		<span className={styles.itemCheckbox}>
			<BaseMenu.CheckboxItemIndicator>
				<CheckmarkIcon className={styles.itemCheckboxMark} />
			</BaseMenu.CheckboxItemIndicator>
		</span>
	);
}

export function ItemText({ children }: { children: ReactNode }) {
	return (
		<Text size="md_sub" color="textContrastHigh" weight="medium" className={styles.itemText}>
			{children}
		</Text>
	);
}

export function ItemIcon({
	icon: Icon,
	position = 'left',
}: {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	position?: 'left' | 'right';
}) {
	return <Icon className={clsx(styles.itemIcon, position === 'right' && styles.itemIconRight)} />;
}

/** A radio/selection indicator for an item — an outlined circle, filled when `selected`. */
export function ItemRadio({ selected }: { selected: boolean }) {
	return <span className={styles.itemRadio}>{selected && <span className={styles.itemRadioDot} />}</span>;
}

export function LabelText({ children, maxWidth }: { children: ReactNode; maxWidth?: number }) {
	return (
		<BaseMenu.GroupLabel
			className={styles.groupLabel}
			style={maxWidth !== undefined ? assignInlineVars({ [styles.maxWidthVar]: `${maxWidth}px` }) : undefined}
		>
			{children}
		</BaseMenu.GroupLabel>
	);
}

export function Separator() {
	return <BaseMenu.Separator className={styles.separator} />;
}
