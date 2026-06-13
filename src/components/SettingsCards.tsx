import { Children, cloneElement, type ComponentType, Fragment, isValidElement, type ReactNode } from 'react';
import { Switch } from '@base-ui/react/switch';
import { clsx } from 'clsx';

import {
	ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
	ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
} from '#/components/icons/Chevron';
import type { Props as IconProps } from '#/components/icons/common';
import * as Select from '#/components/Select';
import * as styles from '#/components/SettingsCards.css';
import { Text } from '#/components/Text';

/**
 * The card-sectioned settings vocabulary: a {@link List} of titled {@link Section} cards, each holding
 * whole-row {@link SwitchRow}/{@link SelectRow} rows. Compose a row's leading {@link Icon} and {@link Label};
 * trailing controls are supplied by the row type.
 */
export function List({ children }: { children: ReactNode }) {
	return <div className={styles.list}>{children}</div>;
}

/**
 * A titled card. Rows passed as children are clipped to the card's corners and separated by hairline dividers
 * (inserted automatically, so falsy children may be conditionally rendered).
 */
export function Section({
	children,
	footnoteText,
	titleText,
}: {
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

/** The row's primary text, optionally over a muted second line. */
export function Label({ subtitleText, titleText }: { subtitleText?: ReactNode; titleText: ReactNode }) {
	return (
		<span className={styles.label}>
			<Text size="md" weight="medium" color="text" leading="snug">
				{titleText}
			</Text>
			{subtitleText != null && (
				<Text size="sm" color="textContrastMedium" leading="snug">
					{subtitleText}
				</Text>
			)}
		</span>
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

/** A row that toggles a boolean on press; the whole row is the switch, with the switch skin at its end. */
export function SwitchRow({
	children,
	className,
	disabled,
	label,
	onChange,
	value,
}: {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	label: string;
	onChange: (value: boolean) => void;
	value: boolean;
}) {
	return (
		<Switch.Root
			aria-label={label}
			checked={value}
			disabled={disabled}
			onCheckedChange={onChange}
			className={clsx(styles.row, styles.rowInteractive, className)}
		>
			{children}
			<span className={styles.switchTrack}>
				<span className={styles.switchThumb} />
			</span>
		</Switch.Root>
	);
}

/** A row that opens a dropdown on press; the whole row is the select trigger, showing the current value. */
export function SelectRow<T extends string>({
	children,
	className,
	disabled,
	items,
	label,
	onValueChange,
	value,
}: {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	items: Select.SelectItem[];
	label: string;
	onValueChange: (value: T) => void;
	value: T;
}) {
	const selected = items.find((item) => item.value === value);
	return (
		<Select.Root
			items={items}
			value={value}
			disabled={disabled}
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
					<Text className={styles.value} size="sm" color="textContrastMedium" align="right" numberOfLines={1}>
						{selected?.label}
					</Text>
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
