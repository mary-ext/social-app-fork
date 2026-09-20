'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ComponentProps, ComponentType, ReactNode, SVGProps } from 'react';

import { Checkbox } from '@base-ui/react/checkbox';
import { Collapsible } from '@base-ui/react/collapsible';
import { Radio } from '@base-ui/react/radio';
import { Switch } from '@base-ui/react/switch';
import { clsx } from 'clsx';

import * as Select from '#/components/Select';
import * as styles from '#/components/Settings.css';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { type LinkProps, useInternalLink } from '#/components/web/Link';
import * as Skele from '#/components/web/Skeleton';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import ChevronDownIcon from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';
import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import ChevronUpIcon from '#/icons/central/ChevronTop_round_outlined_radius1_stroke2.svg';

// `negative` colors the label; `primary_subtle` tints the row and colors its label, icon, and trailing content
type RowColor = 'default' | 'negative' | 'primary_subtle';

const rowColorClass = (color: RowColor) => {
	switch (color) {
		case 'default': {
			return undefined;
		}
		case 'negative': {
			return styles.rowNegative;
		}
		case 'primary_subtle': {
			return styles.rowPrimarySubtle;
		}
	}
};

// #region layout

/**
 * groups settings sections in a screen or dialog.
 *
 * @param surface `inset` (default) uses padded cards; `flush` uses edge-to-edge rows
 */
export function List({ children, surface = 'inset' }: { children: ReactNode; surface?: 'flush' | 'inset' }) {
	return <div className={clsx(styles.list, surface === 'flush' && styles.listFlush)}>{children}</div>;
}

/**
 * groups rows with an optional heading and footnote.
 *
 * @param bodyText description below the title
 * @param footnoteText note below the rows
 */
export function Section({
	bodyText,
	children,
	footnoteText,
	titleText,
}: {
	bodyText?: ReactNode;
	children: ReactNode;
	footnoteText?: ReactNode;
	titleText?: ReactNode;
}) {
	return (
		<div className={styles.section}>
			{(titleText != null || bodyText != null) && (
				<div className={styles.sectionHeading}>
					{titleText != null && (
						<Text weight="semiBold" color="textContrastHigh">
							{titleText}
						</Text>
					)}
					{bodyText != null && (
						<Text size="md_sub" color="textContrastMedium">
							{bodyText}
						</Text>
					)}
				</div>
			)}
			<div className={styles.card}>{children}</div>
			{footnoteText != null && (
				<Text className={styles.sectionFootnote} size="sm" color="textContrastMedium">
					{footnoteText}
				</Text>
			)}
		</div>
	);
}

/** an inset group of related rows. accepts `div` props for use with Base UI's `render` prop. */
export function Group({ className, ...props }: ComponentProps<'div'>) {
	return <div {...props} className={clsx(styles.group, className)} />;
}

/**
 * groups a row and sibling controls under one divider and border radius. position sibling controls
 * absolutely; buttons cannot nest inside a row's button.
 */
export function Item({ children }: { children: ReactNode }) {
	return <div className={styles.item}>{children}</div>;
}

// #endregion

// #region row contents

/** the row's leading icon. */
export function Icon({ icon: IconCmp }: { icon: ComponentType<SVGProps<SVGSVGElement>> }) {
	return <IconCmp className={styles.leading} />;
}

/** a fixed-width leading slot for custom content. oversized content stays centered without shifting the label. */
export function Leading({ children }: { children: ReactNode }) {
	return <span className={styles.leading}>{children}</span>;
}

/**
 * a row title with an optional subtitle.
 *
 * @param loading replace the subtitle with a skeleton
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
		<span className={styles.label}>
			<Text className={styles.title} size="md" weight="medium" color="text">
				{titleText}
			</Text>
			{loading ? (
				<Skele.Text color="contrast_100" size="md_sub" width={140} />
			) : (
				subtitleText != null && (
					<Text size="md_sub" color="textContrastMedium">
						{subtitleText}
					</Text>
				)
			)}
		</span>
	);
}

/** trailing content for rows without a built-in control. */
export function Trailing({ children }: { children: ReactNode }) {
	return <span className={styles.trailing}>{children}</span>;
}

/**
 * value shown beside a settings row's chevron.
 *
 * @param text value to display
 */
export function Value({ text }: { text: string }) {
	return (
		<Text align="right" className={styles.value} color="textContrastMedium" numberOfLines={1} size="md_sub">
			{text}
		</Text>
	);
}

// #endregion

// #region rows

/** a non-interactive row, for read-only values or rows whose only controls are in {@link Trailing}. */
export function StaticRow({ children }: { children: ReactNode }) {
	return <div className={styles.row}>{children}</div>;
}

/**
 * an action button without a chevron.
 *
 * @param color the row's accent. defaults to `default`.
 * @param loading show a spinner and disable the row
 */
export function ActionRow({
	children,
	color = 'default',
	label,
	loading,
	onPress,
}: {
	children: ReactNode;
	color?: RowColor;
	label: string;
	loading?: boolean;
	onPress: () => void;
}) {
	return (
		<PressableRow color={color} disabled={loading} label={label} onPress={onPress}>
			{children}
			{loading && (
				<Trailing>
					<Spinner color="default" label={label} size="sm" />
				</Trailing>
			)}
		</PressableRow>
	);
}

/**
 * a button with a trailing chevron, for opening a dialog or similar view.
 *
 * @param color the row's accent. defaults to `default`.
 * @param valueText current value beside the chevron; use for short values rather than a subtitle
 */
export function ButtonRow({
	children,
	color = 'default',
	label,
	onPress,
	valueText,
}: {
	children: ReactNode;
	color?: RowColor;
	label: string;
	onPress: () => void;
	valueText?: string;
}) {
	return (
		<PressableRow color={color} label={label} onPress={onPress}>
			{children}
			<RowTrailing chevron={ChevronRightIcon} text={valueText} />
		</PressableRow>
	);
}

function PressableRow({
	children,
	color,
	disabled,
	label,
	onPress,
}: {
	children: ReactNode;
	color: RowColor;
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
			className={clsx(styles.row, styles.rowInteractive, rowColorClass(color))}
		>
			{children}
		</button>
	);
}

/** a navigation link with a trailing chevron. */
export function LinkRow({
	children,
	label,
	to,
}: {
	children: ReactNode;
	label: string;
	to: LinkProps['to'];
}) {
	const { href, onClick } = useInternalLink({ to });
	return (
		<a href={href} aria-label={label} className={clsx(styles.row, styles.rowInteractive)} onClick={onClick}>
			{children}
			<RowTrailing chevron={ChevronRightIcon} />
		</a>
	);
}

/**
 * an expandable row containing more settings or explanatory content.
 *
 * @param children content shown when expanded
 * @param panel `rows` (default) continues the section's rows; `body` adds padding around other content
 * @param trailing content shown beside the chevron while collapsed
 */
export function CollapsibleRow({
	children,
	icon,
	label,
	onOpenChange,
	open,
	panel = 'rows',
	titleText,
	trailing,
}: {
	children: ReactNode;
	icon?: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	panel?: 'body' | 'rows';
	titleText: ReactNode;
	trailing?: ReactNode;
}) {
	return (
		<Collapsible.Root className={styles.item} onOpenChange={onOpenChange} open={open}>
			<Collapsible.Trigger
				render={
					<button
						aria-label={label}
						className={clsx(styles.row, styles.rowInteractive, styles.collapsibleTrigger)}
						type="button"
					/>
				}
			>
				{icon != null && <Icon icon={icon} />}
				<Label titleText={titleText} />
				<Trailing>
					{!open && trailing}
					{open ? (
						<ChevronUpIcon className={styles.chevron} />
					) : (
						<ChevronDownIcon className={styles.chevron} />
					)}
				</Trailing>
			</Collapsible.Trigger>
			{panel === 'rows' ? (
				<Collapsible.Panel className={clsx(styles.panel, styles.panelRows)}>{children}</Collapsible.Panel>
			) : (
				<Collapsible.Panel className={styles.panel}>
					<div className={styles.panelBody}>{children}</div>
				</Collapsible.Panel>
			)}
		</Collapsible.Root>
	);
}

/**
 * a switch toggled by pressing anywhere on the row.
 *
 * @param loading show a spinner and disable the row
 */
export function SwitchRow({
	children,
	disabled,
	label,
	loading,
	onChange,
	value,
}: {
	children: ReactNode;
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
			className={clsx(styles.row, styles.rowInteractive)}
		>
			{children}
			<Trailing>
				{loading && <Spinner color="default" label={label} size="sm" />}
				<span className={styles.switchTrack}>
					<span className={styles.switchThumb} />
				</span>
			</Trailing>
		</Switch.Root>
	);
}

/** a dropdown triggered by the whole row, with the selected label beside the chevron. */
export function SelectRow<T = string>({
	children,
	items,
	label,
	onValueChange,
	value,
}: {
	children: ReactNode;
	items: Select.SelectItem<T>[];
	label: string;
	onValueChange: (value: T) => void;
	value: T;
}) {
	const selected = items.find((item) => item.value === value);
	return (
		<Select.Root items={items} value={value} onValueChange={onValueChange}>
			<Select.Trigger
				render={
					<button type="button" aria-label={label} className={clsx(styles.row, styles.rowInteractive)} />
				}
			>
				{children}
				<RowTrailing chevron={ChevronDownIcon} text={selected?.label} />
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

/**
 * a radio row. requires a Base UI `RadioGroup` parent.
 *
 * @param children the row's label
 */
export function RadioRow({
	children,
	className,
	label,
	value,
}: {
	children: ReactNode;
	className?: string;
	label: string;
	value: string;
}) {
	return (
		<Radio.Root
			aria-label={label}
			className={clsx(styles.row, styles.rowInteractive, className)}
			value={value}
		>
			<span className={clsx(styles.leading, styles.radio)}>
				<Radio.Indicator className={styles.radioDot} />
			</span>
			{children}
		</Radio.Root>
	);
}

/**
 * a checkbox row. requires a Base UI `CheckboxGroup` parent.
 *
 * @param children the row's label
 */
export function CheckboxRow({
	children,
	label,
	value,
}: {
	children: ReactNode;
	label: string;
	value: string;
}) {
	return (
		<Checkbox.Root aria-label={label} className={clsx(styles.row, styles.rowInteractive)} value={value}>
			<span className={clsx(styles.leading, styles.checkbox)}>
				<Checkbox.Indicator className={styles.checkboxIndicator}>
					<CheckIcon className={styles.checkIcon} />
				</Checkbox.Indicator>
			</span>
			{children}
		</Checkbox.Root>
	);
}

function RowTrailing({
	chevron: ChevronCmp,
	text,
}: {
	chevron: ComponentType<SVGProps<SVGSVGElement>>;
	text?: string;
}) {
	return (
		<Trailing>
			{text != null && <Value text={text} />}
			<ChevronCmp className={styles.chevron} />
		</Trailing>
	);
}

// #endregion
