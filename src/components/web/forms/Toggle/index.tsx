import { type ComponentType, createContext, type ReactNode, useContext } from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { clsx } from 'clsx';

import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import type { Props as IconProps } from '#/components/icons/common';
import * as styles from '#/components/web/forms/Toggle/Toggle.css';

type GroupContextValue = {
	/** True once a {@link Group}'s `maxSelections` cap is reached; unchecked {@link Item}s read it to disable. */
	maxReached: boolean;
	values: string[];
};

const GroupContext = createContext<GroupContextValue>({ maxReached: false, values: [] });

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
	maxSelections,
	className,
	children,
}: {
	type?: 'checkbox' | 'radio';
	label: string;
	values: string[];
	onChange: (values: string[]) => void;
	disabled?: boolean;
	/** Caps how many entries can be selected; unchecked {@link Item}s disable once reached. Checkbox groups only. */
	maxSelections?: number;
	className?: string;
	children: ReactNode;
}) {
	const maxReached = type === 'checkbox' && maxSelections != null && values.length >= maxSelections;

	return (
		<GroupContext.Provider value={{ maxReached, values }}>
			{type === 'radio' ? (
				<BaseRadioGroup
					aria-label={label}
					className={className}
					disabled={disabled}
					onValueChange={(value) => onChange(value ? [String(value)] : [])}
					value={values[0] ?? ''}
				>
					{children}
				</BaseRadioGroup>
			) : (
				<CheckboxGroup
					aria-label={label}
					className={className}
					disabled={disabled}
					onValueChange={onChange}
					value={values}
				>
					{children}
				</CheckboxGroup>
			)}
		</GroupContext.Provider>
	);
}

/**
 * A checkbox toggle. Pass `name` to enrol it in the surrounding {@link Group}; pass `checked`/`onChange` to
 * drive it standalone. Enrolled items auto-disable once the group's `maxSelections` cap is reached.
 */
export function Item({
	name,
	checked,
	onChange,
	disabled,
	className,
	label,
	children,
}: {
	name?: string;
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
	label: string;
	children: ReactNode;
}) {
	const { maxReached, values } = useContext(GroupContext);
	const selected = name != null && values.includes(name);
	const isDisabled = disabled || (maxReached && !selected);

	return (
		<Checkbox.Root
			aria-label={label}
			checked={checked}
			className={clsx(styles.item, className)}
			disabled={isDisabled}
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
	size = 'default',
	children,
}: {
	active?: boolean;
	adjacent?: 'both' | 'leading' | 'none' | 'trailing';
	/** `small` tightens padding/height and squares the corners to a flat radius (skips `adjacent`). */
	size?: 'default' | 'small';
	children: ReactNode;
}) {
	return (
		<span
			className={styles.panel({ active, adjacent, size })}
			data-active={active || undefined}
			data-size={size}
		>
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
	return <Icon className={styles.panelIcon} size="md" fill="currentColor" />;
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
