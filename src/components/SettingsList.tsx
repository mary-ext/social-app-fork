import { type ComponentType, createContext, type ReactNode, useContext, useRef } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { clsx } from 'clsx';

import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import type { Props as IconProps } from '#/components/icons/common';
import { type LinkProps, useLink } from '#/components/Link';
import * as styles from '#/components/SettingsList.css';
import { Text } from '#/components/Text';

/**
 * Carries the `destructive` flag down a row so its {@link ItemIcon}/{@link ItemText}/{@link Chevron} render in
 * the negative tint.
 */
const ItemContext = createContext<{ destructive: boolean }>({ destructive: false });

const useResolvedDestructive = (override?: boolean) => {
	const { destructive } = useContext(ItemContext);
	return typeof override === 'boolean' ? override : destructive;
};

export function Container({ children }: { children: ReactNode }) {
	return <div className={styles.container}>{children}</div>;
}

/**
 * A titled settings section. children render in order (no teleporting of icons/title into a header row), so
 * write the `ItemText` heading first.
 */
export function Group({
	children,
	destructive = false,
}: {
	children: ReactNode;
	destructive?: boolean;
	/** Accepted for API compatibility; a no-op here since this slice renders no item icons. */
	iconInset?: boolean;
}) {
	return (
		<div className={styles.group}>
			<ItemContext.Provider value={{ destructive }}>{children}</ItemContext.Provider>
		</div>
	);
}

/**
 * A single non-interactive settings row. Wrap interactive content (e.g. a toggle) so the row aligns with
 * sibling {@link LinkItem}/{@link PressableItem} rows.
 */
export function Item({
	align,
	children,
	destructive,
	iconInset,
}: {
	align?: 'start';
	children?: ReactNode;
	destructive?: boolean;
	iconInset?: boolean;
}) {
	const resolved = useResolvedDestructive(destructive);
	return (
		<div
			className={clsx(
				styles.item,
				iconInset && styles.itemIconInset,
				align === 'start' && styles.itemAlignStart,
			)}
		>
			<ItemContext.Provider value={{ destructive: resolved }}>{children}</ItemContext.Provider>
		</div>
	);
}

/**
 * A settings row that toggles a checkbox on press, rendered as a Base UI checkbox root. Compose with
 * {@link ItemIcon}/{@link ItemText}/{@link LabelText} children and a {@link CheckboxBox} placed where the box
 * should sit.
 *
 * Pass `flush` when nesting inside a {@link Group} (which already supplies the horizontal padding).
 */
export function CheckboxItem({
	label,
	value,
	onChange,
	disabled,
	flush,
	children,
}: {
	label: string;
	value: boolean;
	onChange: (value: boolean) => void;
	disabled?: boolean;
	flush?: boolean;
	children: ReactNode;
}) {
	return (
		<BaseCheckbox.Root
			aria-label={label}
			checked={value}
			disabled={disabled}
			onCheckedChange={onChange}
			className={clsx(styles.item, styles.itemInteractive, flush && styles.itemFlush)}
		>
			{children}
		</BaseCheckbox.Root>
	);
}

/** The 24×24 checkbox box; place it as a child of {@link CheckboxItem} to control its position (left/right). */
export function CheckboxBox() {
	return (
		<span className={styles.checkboxBox}>
			<BaseCheckbox.Indicator className={styles.checkboxIndicator}>
				<CheckIcon width={14} fill="currentColor" />
			</BaseCheckbox.Indicator>
		</span>
	);
}

/**
 * A settings row that navigates on press, rendered as an `<a>`. Always appends a trailing chevron. Compose
 * with {@link ItemIcon}/{@link ItemText}/{@link BadgeText} children.
 */
export function LinkItem({
	align,
	to,
	label,
	children,
	destructive,
	iconInset,
}: {
	align?: 'start';
	to: LinkProps['to'];
	label: string;
	children: ReactNode;
	destructive?: boolean;
	iconInset?: boolean;
}) {
	const { href, onPress } = useLink({ to, displayText: label });
	const resolved = useResolvedDestructive(destructive);
	return (
		<a
			href={href}
			aria-label={label}
			className={clsx(
				styles.item,
				styles.itemInteractive,
				styles.itemHover,
				iconInset && styles.itemIconInset,
				align === 'start' && styles.itemAlignStart,
			)}
			// useLink resolves navigation off a DOM-shaped MouseEvent; the RN type is nominal only here
			onClick={(e) => onPress(e as unknown as GestureResponderEvent)}
		>
			<ItemContext.Provider value={{ destructive: resolved }}>
				{children}
				<Chevron />
			</ItemContext.Provider>
		</a>
	);
}

/**
 * A settings row that fires a callback on press, rendered as a `<button>`. Compose with
 * {@link ItemIcon}/{@link ItemText}/{@link BadgeText}/{@link Chevron} children.
 */
export function PressableItem({
	align,
	children,
	label,
	accessibilityHint,
	destructive,
	iconInset,
	onPress,
	onLongPress,
}: {
	align?: 'start';
	children: ReactNode;
	label: string;
	accessibilityHint?: string;
	destructive?: boolean;
	iconInset?: boolean;
	onPress?: () => void;
	onLongPress?: () => void;
}) {
	const resolved = useResolvedDestructive(destructive);
	const firedLongPress = useRef(false);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const startLongPress = () => {
		if (!onLongPress) {
			return;
		}
		firedLongPress.current = false;
		timer.current = setTimeout(() => {
			firedLongPress.current = true;
			onLongPress();
		}, 500);
	};
	const cancelLongPress = () => {
		clearTimeout(timer.current);
	};

	return (
		<button
			type="button"
			aria-label={label}
			aria-description={accessibilityHint}
			className={clsx(
				styles.item,
				styles.itemInteractive,
				styles.itemHover,
				iconInset && styles.itemIconInset,
				align === 'start' && styles.itemAlignStart,
			)}
			onClick={() => {
				if (firedLongPress.current) {
					firedLongPress.current = false;
					return;
				}
				onPress?.();
			}}
			onPointerDown={startLongPress}
			onPointerLeave={cancelLongPress}
			onPointerUp={cancelLongPress}
		>
			<ItemContext.Provider value={{ destructive: resolved }}>{children}</ItemContext.Provider>
		</button>
	);
}

export function ItemIcon({ icon: Icon }: { icon: ComponentType<IconProps> }) {
	const { destructive } = useContext(ItemContext);
	return (
		<span className={clsx(styles.itemIcon, destructive && styles.destructiveIcon)}>
			<Icon size="lg" fill="currentColor" />
		</span>
	);
}

export function ItemText({ children }: { children: ReactNode }) {
	const { destructive } = useContext(ItemContext);
	return (
		<Text size="md" color={destructive ? 'negative_500' : 'text'} className={styles.itemText}>
			{children}
		</Text>
	);
}

/**
 * The semibold label for an interactive control (checkbox/radio row). Defaults to the small text size; pass
 * `size="md"` for rows that read as primary settings items.
 */
export function LabelText({ children, size = 'sm' }: { children: ReactNode; size?: 'md' | 'sm' }) {
	return (
		<Text size={size} weight="semiBold" color="textContrastHigh" leading="tight" className={styles.itemText}>
			{children}
		</Text>
	);
}

/** A muted, right-aligned trailing label (e.g. a current-value summary on a {@link LinkItem}). */
export function BadgeText({ children }: { children: ReactNode }) {
	return (
		<Text size="md" color="textContrastLow" align="right" leading="snug" numberOfLines={1}>
			{children}
		</Text>
	);
}

/** A trailing affordance indicating a row navigates. {@link LinkItem} appends one automatically. */
export function Chevron() {
	const { destructive } = useContext(ItemContext);
	return (
		<span className={clsx(styles.chevron, destructive && styles.destructiveIcon)}>
			<ChevronRightIcon size="md" fill="currentColor" />
		</span>
	);
}

export function Divider() {
	return <div className={styles.divider} />;
}
