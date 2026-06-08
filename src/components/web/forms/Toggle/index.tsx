import type { ComponentType, ReactNode } from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import type { Props as IconProps } from '#/components/icons/common';
import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/forms/Toggle/Toggle.css';

/**
 * A multi-select checkbox group (or single-select radio group) holding {@link Item}/{@link RadioItem} rows.
 * `values` mirrors the selected entry names; radio groups carry at most one.
 */
export function Group({
	type = 'checkbox',
	label,
	values,
	onChange,
	disabled,
	className,
	children,
}: {
	type?: 'checkbox' | 'radio';
	label: string;
	values: string[];
	onChange: (values: string[]) => void;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}) {
	if (type === 'radio') {
		return (
			<BaseRadioGroup
				aria-label={label}
				className={className}
				disabled={disabled}
				onValueChange={(value) => onChange(value ? [String(value)] : [])}
				value={values[0] ?? ''}
			>
				{children}
			</BaseRadioGroup>
		);
	}
	return (
		<CheckboxGroup
			aria-label={label}
			className={className}
			disabled={disabled}
			onValueChange={onChange}
			value={values}
		>
			{children}
		</CheckboxGroup>
	);
}

/**
 * A checkbox toggle. Pass `name` to enrol it in the surrounding {@link Group}; pass `checked`/`onChange` to
 * drive it standalone.
 */
export function Item({
	name,
	checked,
	onChange,
	disabled,
	label,
	children,
}: {
	name?: string;
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
	label: string;
	children: ReactNode;
}) {
	return (
		<Checkbox.Root
			aria-label={label}
			checked={checked}
			className={styles.item}
			disabled={disabled}
			name={name}
			onCheckedChange={(value) => onChange?.(value)}
		>
			{children}
		</Checkbox.Root>
	);
}

/** A non-toggle clickable row styled to match the stack (e.g. an expander); not part of a {@link Group}. */
export function Action({
	label,
	pressed,
	onClick,
	children,
}: {
	label: string;
	pressed?: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button aria-label={label} aria-pressed={pressed} className={styles.item} onClick={onClick} type="button">
			{children}
		</button>
	);
}

/** A single radio toggle; `value` is the entry it contributes to the radio {@link Group}'s selection. */
export function RadioItem({ value, label, children }: { value: string; label: string; children: ReactNode }) {
	return (
		<Radio.Root aria-label={label} className={styles.radioItem} value={value}>
			{children}
		</Radio.Root>
	);
}

/** A group of stacked {@link Panel}s with the hairline gaps that produce the segmented look. */
export function PanelGroup({ children }: { children: ReactNode }) {
	return <div className={styles.panelGroup}>{children}</div>;
}

/**
 * The themed surface inside a toggle. Inside an {@link Item}/{@link RadioItem} the active styling tracks the
 * toggle; pass `active` to drive it directly (e.g. a non-toggle expander row).
 */
export function Panel({
	active,
	adjacent = 'none',
	children,
}: {
	active?: boolean;
	adjacent?: 'both' | 'leading' | 'none' | 'trailing';
	children: ReactNode;
}) {
	return (
		<span className={cx(styles.panel, styles.panelAdjacent[adjacent], active && styles.panelActive)}>
			{children}
		</span>
	);
}

// the *Text suffix makes the lint expect a <Text> return, but this renders a styled DOM span whose
// callers already wrap user-facing strings in <Trans>
export function PanelText({ icon, children }: { icon?: ComponentType<IconProps>; children: ReactNode }) {
	if (icon) {
		// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
		return (
			<span className={styles.panelTextWithIcon}>
				<PanelIcon icon={icon} />
				<span className={styles.panelText}>{children}</span>
			</span>
		);
	}
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return <span className={styles.panelText}>{children}</span>;
}

export function PanelIcon({ icon: Icon }: { icon: ComponentType<IconProps> }) {
	return (
		<span className={styles.panelIcon}>
			<Icon size="md" fill="currentColor" />
		</span>
	);
}

/** The radio dot indicator; render inside a {@link RadioItem}. */
export function RadioIndicator() {
	return (
		<span className={styles.circle}>
			<Radio.Indicator className={styles.dot} />
		</span>
	);
}

/** The checkbox tick indicator; render inside an {@link Item}. */
export function CheckboxIndicator() {
	return (
		<span className={styles.box}>
			<Checkbox.Indicator className={styles.check}>
				<CheckIcon width={14} fill="currentColor" />
			</Checkbox.Indicator>
		</span>
	);
}

/** The sliding switch indicator; render inside a standalone {@link Item}. */
export function Switch() {
	return (
		<span className={styles.switchTrack}>
			<span className={styles.switchThumb} />
		</span>
	);
}
