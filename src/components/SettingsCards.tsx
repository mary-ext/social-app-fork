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

/**
 * The row's primary text, optionally over a muted second line. Renders the two lines as separate row-grid
 * items (not a nested column) so the subtitle can span the full row width beneath the trailing control.
 */
export function Label({ subtitleText, titleText }: { subtitleText?: ReactNode; titleText: ReactNode }) {
	return (
		<>
			<Text className={styles.title} size="md" weight="medium" color="text" leading="snug">
				{titleText}
			</Text>
			{subtitleText != null && (
				<Text className={styles.subtitle} size="sm" color="textContrastMedium" leading="snug">
					{subtitleText}
				</Text>
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
						className={clsx(styles.row, styles.rowInteractive, styles.rowSelect, className)}
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
