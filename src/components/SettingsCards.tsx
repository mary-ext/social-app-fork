import { Children, cloneElement, type ComponentType, Fragment, isValidElement, type ReactNode } from 'react';

import { Collapsible } from '@base-ui/react/collapsible';
import { Switch } from '@base-ui/react/switch';
import { clsx } from 'clsx';

import {
	ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
	ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
	ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron';
import type { Props as IconProps } from '#/components/icons/common';
import * as Select from '#/components/Select';
import * as styles from '#/components/SettingsCards.css';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { type LinkProps, useInternalLink } from '#/components/web/Link';
import * as Skele from '#/components/web/Skeleton';

/**
 * card-sectioned settings vocabulary: a list of titled section cards, each holding whole-row button, switch,
 * or select rows. compose a row's leading icon and label; trailing controls are supplied by the row type.
 */
export function List({ children }: { children: ReactNode }) {
	return <div className={styles.list}>{children}</div>;
}

/** titled card where children rows are clipped to corners and separated by automatic hairline dividers */
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
				<Text className={styles.sectionBody} size="md_sub" color="textContrastMedium">
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
				<Text className={styles.sectionFootnote} size="sm" color="textContrastMedium">
					{footnoteText}
				</Text>
			)}
		</div>
	);
}

export function Icon({ icon: IconCmp }: { icon: ComponentType<IconProps> }) {
	return <IconCmp className={styles.icon} size="md" fill="currentColor" />;
}

/**
 * the row's primary text, optionally over a muted second line.
 *
 * renders the two lines as separate row-grid items so the subtitle can span the full row width beneath the
 * trailing control.
 *
 * @param loading pass true to show a skeleton bar in the subtitle's place while a drill-in row's value is
 *   fetched.
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
			<Text className={styles.title} size="md" weight="medium" color="text">
				{titleText}
			</Text>
			{loading ? (
				<div className={styles.subtitle}>
					<Skele.Text color="contrast_100" size="md_sub" width={140} />
				</div>
			) : (
				subtitleText != null && (
					<Text className={styles.subtitle} size="md_sub" color="textContrastMedium">
						{subtitleText}
					</Text>
				)
			)}
		</>
	);
}

/**
 * a row button that fires an action on press and displays a trailing chevron.
 *
 * @param color the row color variant. defaults to `secondary`.
 */
export function ButtonRow({
	children,
	className,
	color = 'secondary',
	label,
	onPress,
}: {
	children: ReactNode;
	className?: string;
	color?: 'primary_subtle' | 'secondary';
	label: string;
	onPress: () => void;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={onPress}
			className={clsx(
				styles.row,
				styles.rowInteractive,
				color === 'primary_subtle' && styles.rowPrimarySubtle,
				className,
			)}
		>
			{children}
			<span className={styles.trailing}>
				<ChevronRightIcon className={styles.chevron} size="sm" fill="currentColor" />
			</span>
		</button>
	);
}

/**
 * a bare navigating row `<a>` with interactive chrome (hover/focus/reset).
 *
 * the caller provides the row layout (a {@link row}/{@link rowPlain} class via `className`) and every slot.
 * use {@link LinkRow} for the common icon/label grid form with a trailing chevron.
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
	const { href, onClick } = useInternalLink({ to });
	return (
		<a href={href} aria-label={label} className={clsx(styles.rowInteractive, className)} onClick={onClick}>
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
				<ChevronRightIcon className={styles.chevron} size="sm" fill="currentColor" />
			</span>
		</LinkRowRaw>
	);
}

/**
 * an expandable row that reveals its `children` rows in a height-animated panel with a flipping chevron.
 * renders as a single Section child, providing automatic dividers for inner rows.
 *
 * @param children the content to reveal when expanded
 * @param trailing content shown beside the chevron while collapsed
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
				<Text className={styles.title} color="text" size="md" weight="medium">
					{titleText}
				</Text>
				<span className={styles.trailing}>
					{!open && trailing}
					{open ? (
						<ChevronUpIcon className={styles.chevron} fill="currentColor" size="sm" />
					) : (
						<ChevronDownIcon className={styles.chevron} fill="currentColor" size="sm" />
					)}
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
 * row that toggles a boolean on press.
 *
 * @param loading show a spinner and freeze the row while the change is being persisted
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
				{loading && <Spinner color="default" label={label} size="sm" />}
				<span className={styles.switchTrack}>
					<span className={styles.switchThumb} />
				</span>
			</span>
		</Switch.Root>
	);
}

/** row that opens a dropdown on press, where the whole row acts as the trigger showing the current value. */
export function SelectRow<T extends string>({
	children,
	className,
	items,
	label,
	onValueChange,
	value,
}: {
	children: ReactNode;
	className?: string;
	items: Select.SelectItem[];
	label: string;
	onValueChange: (value: T) => void;
	value: T;
}) {
	const selected = items.find((item) => item.value === value);
	return (
		<Select.Root items={items} value={value} onValueChange={onValueChange}>
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
					<Text
						className={styles.value}
						size="md_sub"
						color="textContrastMedium"
						align="right"
						numberOfLines={1}
					>
						{selected?.label}
					</Text>
					<ChevronDownIcon className={styles.chevron} size="sm" fill="currentColor" />
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
