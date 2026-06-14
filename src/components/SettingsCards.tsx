import { Children, cloneElement, type ComponentType, Fragment, isValidElement, type ReactNode } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Collapsible } from '@base-ui/react/collapsible';
import { Switch } from '@base-ui/react/switch';
import { clsx } from 'clsx';

import {
	ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
	ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
	ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron';
import type { Props as IconProps } from '#/components/icons/common';
import { type LinkProps, useLink } from '#/components/Link';
import * as Select from '#/components/Select';
import * as styles from '#/components/SettingsCards.css';
import * as Skele from '#/components/Skeleton';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

/**
 * The card-sectioned settings vocabulary: a {@link List} of titled {@link Section} cards, each holding
 * whole-row {@link ButtonRow}/{@link SwitchRow}/{@link SelectRow} rows. Compose a row's leading {@link Icon}
 * and {@link Label}; trailing controls are supplied by the row type.
 */
export function List({ children }: { children: ReactNode }) {
	return <div className={styles.list}>{children}</div>;
}

/**
 * A titled card. Rows passed as children are clipped to the card's corners and separated by hairline dividers
 * (inserted automatically, so falsy children may be conditionally rendered).
 */
export function Section({
	bodyText,
	children,
	footnoteText,
	titleText,
}: {
	/** Explanatory body copy rendered above the card, below the title if there is one. */
	bodyText?: ReactNode;
	children: ReactNode;
	/** Muted helper text rendered under the card. */
	footnoteText?: ReactNode;
	titleText?: ReactNode;
}) {
	const rows = Children.toArray(children).filter(isValidElement<{ className?: string }>);
	return (
		<div className={styles.section}>
			{titleText != null && (
				<Text className={styles.sectionHeader} size="md" weight="semiBold" color="textContrastHigh">
					{titleText}
				</Text>
			)}
			{bodyText != null && (
				<Text className={styles.sectionBody} size="sm" color="textContrastMedium" leading="snug">
					{bodyText}
				</Text>
			)}
			<div className={styles.card}>
				{rows.map((row, i) => (
					<Fragment key={row.key ?? i}>
						{i > 0 && <div className={styles.divider} />}
						{/* round only the card's end rows so their hover/focus follow the card corner; computed
						    at the element level (not via CSS `:first-child`) since Switch rows emit sibling DOM inputs */}
						{cloneElement(row, {
							className: clsx(
								row.props.className,
								i === 0 && styles.rowFirst,
								i === rows.length - 1 && styles.rowLast,
							),
						})}
					</Fragment>
				))}
			</div>
			{footnoteText != null && (
				<Text className={styles.sectionFootnote} size="sm" color="textContrastMedium" leading="snug">
					{footnoteText}
				</Text>
			)}
		</div>
	);
}

export function Icon({ icon: IconCmp }: { icon: ComponentType<IconProps> }) {
	return (
		<span className={styles.icon}>
			<IconCmp size="md" fill="currentColor" />
		</span>
	);
}

/**
 * The row's primary text, optionally over a muted second line. Renders the two lines as separate row-grid
 * items (not a nested column) so the subtitle can span the full row width beneath the trailing control. Pass
 * `loading` to show a skeleton bar in the subtitle's place while a drill-in row's value is fetched.
 */
export function Label({
	loading,
	subtitleText,
	titleText,
}: {
	loading?: boolean;
	subtitleText?: ReactNode;
	titleText: ReactNode;
}) {
	return (
		<>
			<Text className={styles.title} size="md" weight="medium" color="text" leading="snug">
				{titleText}
			</Text>
			{loading ? (
				<div className={styles.subtitle}>
					<Skele.Text style={{ width: 140 }} />
				</div>
			) : (
				subtitleText != null && (
					<Text className={styles.subtitle} size="sm" color="textContrastMedium" leading="snug">
						{subtitleText}
					</Text>
				)
			)}
		</>
	);
}

/** A row that fires an action on press; the whole row is the button, with a trailing forward chevron. */
export function ButtonRow({
	children,
	className,
	disabled,
	label,
	onPress,
}: {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	label: string;
	onPress: () => void;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			disabled={disabled}
			onClick={onPress}
			className={clsx(styles.row, styles.rowInteractive, className)}
		>
			{children}
			<span className={styles.trailing}>
				<span className={styles.chevron}>
					<ChevronRightIcon size="sm" fill="currentColor" />
				</span>
			</span>
		</button>
	);
}

/**
 * A bare navigating row: an `<a>` with only the interactive chrome (hover/focus/reset) — the caller brings
 * the row layout (a {@link row}/{@link rowPlain} class via `className`) and every slot. Use {@link LinkRow}
 * for the common icon/label grid form with a trailing chevron.
 */
export function LinkRowRaw({
	children,
	className,
	label,
	to,
}: {
	children: ReactNode;
	className?: string;
	label: string;
	to: LinkProps['to'];
}) {
	const { href, onPress } = useLink({ to, displayText: label });
	return (
		<a
			href={href}
			aria-label={label}
			className={clsx(styles.rowInteractive, className)}
			// useLink resolves navigation off a DOM-shaped MouseEvent; the RN type is nominal only here
			onClick={(e) => onPress(e as unknown as GestureResponderEvent)}
		>
			{children}
		</a>
	);
}

/**
 * A row that navigates on press, rendered as an `<a>`; the whole row is the link, with a trailing forward
 * chevron.
 */
export function LinkRow({
	children,
	className,
	label,
	to,
}: {
	children: ReactNode;
	className?: string;
	label: string;
	to: LinkProps['to'];
}) {
	return (
		<LinkRowRaw className={clsx(styles.row, className)} label={label} to={to}>
			{children}
			<span className={styles.trailing}>
				<span className={styles.chevron}>
					<ChevronRightIcon size="sm" fill="currentColor" />
				</span>
			</span>
		</LinkRowRaw>
	);
}

/**
 * A row that expands on press to reveal its `children` rows in a height-animated panel, with a chevron that
 * flips on open. Renders as one Section child; its inner rows get automatic dividers like {@link Section}.
 * Pass `trailing` for content shown beside the chevron while collapsed (e.g. an avatar-stack peek).
 */
export function CollapsibleRow({
	children,
	className,
	icon,
	label,
	onOpenChange,
	open,
	titleText,
	trailing,
}: {
	children: ReactNode;
	className?: string;
	icon?: ComponentType<IconProps>;
	label: string;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	titleText: ReactNode;
	trailing?: ReactNode;
}) {
	const rows = Children.toArray(children).filter(isValidElement<{ className?: string }>);
	// Section rounds this disclosure's card corners by injecting rowFirst/rowLast into our className. We push
	// that rounding onto the actual corner rows (trigger, last panel row) instead of clipping with
	// `overflow: hidden`, so their focus rings follow the corner rather than being clipped square.
	const roundTop = className?.includes(styles.rowFirst) ?? false;
	const roundBottom = className?.includes(styles.rowLast) ?? false;
	return (
		<Collapsible.Root className={className} onOpenChange={onOpenChange} open={open}>
			<Collapsible.Trigger
				render={
					<button
						aria-label={label}
						className={clsx(
							styles.row,
							styles.rowInteractive,
							roundTop && styles.rowFirst,
							!open && roundBottom && styles.rowLast,
						)}
						type="button"
					/>
				}
			>
				{icon != null && <Icon icon={icon} />}
				<Text className={styles.title} color="text" leading="snug" size="md" weight="medium">
					{titleText}
				</Text>
				<span className={styles.trailing}>
					{!open && trailing}
					<span className={styles.chevron}>
						{open ? (
							<ChevronUpIcon fill="currentColor" size="sm" />
						) : (
							<ChevronDownIcon fill="currentColor" size="sm" />
						)}
					</span>
				</span>
			</Collapsible.Trigger>
			<Collapsible.Panel className={styles.panel}>
				{rows.map((row, i) => {
					const roundedRow =
						i === rows.length - 1 && roundBottom
							? cloneElement(row, { className: clsx(row.props.className, styles.rowLast) })
							: row;
					return (
						<Fragment key={row.key ?? i}>
							<div className={styles.divider} />
							{roundedRow}
						</Fragment>
					);
				})}
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}

/**
 * A row that toggles a boolean on press; the whole row is the switch, with the switch skin at its end. Pass
 * `loading` while the change is being persisted to show a spinner and freeze the row.
 */
export function SwitchRow({
	children,
	className,
	disabled,
	label,
	loading,
	onChange,
	value,
}: {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	label: string;
	loading?: boolean;
	onChange: (value: boolean) => void;
	value: boolean;
}) {
	return (
		<Switch.Root
			aria-label={label}
			checked={value}
			disabled={disabled || loading}
			onCheckedChange={onChange}
			className={clsx(styles.row, styles.rowInteractive, className)}
		>
			{children}
			<span className={styles.trailing}>
				{loading && <Spinner color="currentColor" label={label} size="sm" />}
				<span className={styles.switchTrack}>
					<span className={styles.switchThumb} />
				</span>
			</span>
		</Switch.Root>
	);
}

/**
 * A row that opens a dropdown on press; the whole row is the select trigger, showing the current value. Pass
 * `loading` while the value is still being fetched to show a spinner in its place.
 */
export function SelectRow<T extends string>({
	children,
	className,
	disabled,
	items,
	label,
	loading,
	onValueChange,
	value,
}: {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	items: Select.SelectItem[];
	label: string;
	loading?: boolean;
	onValueChange: (value: T) => void;
	value: T;
}) {
	const selected = items.find((item) => item.value === value);
	return (
		<Select.Root
			items={items}
			value={value}
			disabled={disabled || loading}
			onValueChange={(next) => onValueChange(next as T)}
		>
			<Select.Trigger
				render={
					<button
						type="button"
						aria-label={label}
						className={clsx(styles.row, styles.rowInteractive, className)}
					/>
				}
			>
				{children}
				<span className={styles.trailing}>
					{loading ? (
						<Spinner color="currentColor" label={label} size="sm" />
					) : (
						<Text
							className={styles.value}
							size="sm"
							color="textContrastMedium"
							align="right"
							numberOfLines={1}
						>
							{selected?.label}
						</Text>
					)}
					<span className={styles.chevron}>
						<ChevronDownIcon size="sm" fill="currentColor" />
					</span>
				</span>
			</Select.Trigger>
			<Select.Content
				align="end"
				matchTriggerWidth={false}
				items={items}
				renderItem={({ label: itemLabel, value: itemValue }) => (
					<Select.Item value={itemValue} label={itemLabel}>
						<Select.ItemIndicator />
						<Select.ItemText>{itemLabel}</Select.ItemText>
					</Select.Item>
				)}
			/>
		</Select.Root>
	);
}
