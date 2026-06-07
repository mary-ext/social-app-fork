import { type ComponentType, type ReactNode, useState } from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';

import type { Props as IconProps } from '#/components/icons/common';
import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/Menu/Menu.css';

// a dropdown menu built on Base UI's Menu. Root + Trigger associate the menu with its anchor; pass a
// `handle` (from `createHandle`/`useMenuHandle`) to drive a detached Trigger or open it imperatively.
export const Root = BaseMenu.Root;
export const Trigger = BaseMenu.Trigger;
export const Group = BaseMenu.Group;

/** Creates a detached handle to associate a Trigger with a Root or open/close the menu imperatively. */
export const createHandle = BaseMenu.createHandle;

/** A detached handle for associating a Trigger with a Root or opening/closing a Menu */
export type MenuHandle<T = void> = BaseMenu.Handle<T>;

/** Component-local menu handle. */
export function useMenuHandle<T = void>(): MenuHandle<T> {
	const [handle] = useState(createHandle<T>);
	return handle;
}

/** Portalled positioner + themed popup card. Put `Item`/`Group`/`Separator` inside. */
export function Popup({
	children,
	label,
	align = 'start',
	side = 'bottom',
	sideOffset = 5,
}: {
	children: ReactNode;
	/** Accessible name for the menu. */
	label?: string;
	align?: BaseMenu.Positioner.Props['align'];
	side?: BaseMenu.Positioner.Props['side'];
	sideOffset?: number;
}) {
	return (
		<BaseMenu.Portal>
			<BaseMenu.Positioner
				className={styles.positioner}
				align={align}
				side={side}
				sideOffset={sideOffset}
				collisionPadding={5}
			>
				<BaseMenu.Popup aria-label={label} className={styles.popup}>
					{children}
				</BaseMenu.Popup>
			</BaseMenu.Positioner>
		</BaseMenu.Portal>
	);
}

export function Item({
	children,
	label,
	onClick,
	closeOnClick,
	destructive = false,
	disabled,
}: {
	children: ReactNode;
	/** Overrides the label used for keyboard typeahead (defaults to the item's text). */
	label?: string;
	onClick?: () => void;
	closeOnClick?: boolean;
	destructive?: boolean;
	disabled?: boolean;
}) {
	return (
		<BaseMenu.Item
			className={cx(styles.item, destructive && styles.itemDestructive)}
			label={label}
			onClick={onClick}
			closeOnClick={closeOnClick}
			disabled={disabled}
		>
			{children}
		</BaseMenu.Item>
	);
}

export function ItemText({ children }: { children: ReactNode }) {
	// renders a web <span> that lays out beside the icon — the RN unwrapped-text rule doesn't model this
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return <span className={styles.itemText}>{children}</span>;
}

export function ItemIcon({
	icon: Icon,
	position = 'left',
}: {
	icon: ComponentType<IconProps>;
	position?: 'left' | 'right';
}) {
	return (
		<span className={cx(styles.itemIcon, position === 'right' && styles.itemIconRight)}>
			<Icon size="md" fill="currentColor" />
		</span>
	);
}

/** A radio/selection indicator for an item — an outlined circle, filled when `selected`. */
export function ItemRadio({ selected }: { selected: boolean }) {
	return <span className={styles.itemRadio}>{selected && <span className={styles.itemRadioDot} />}</span>;
}

export function GroupLabel({ children }: { children: ReactNode }) {
	return <BaseMenu.GroupLabel className={styles.groupLabel}>{children}</BaseMenu.GroupLabel>;
}

export function Separator() {
	return <BaseMenu.Separator className={styles.separator} />;
}
