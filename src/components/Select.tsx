'use no memo'; // composition props usually invalidate the generated wrapper caches

import { createContext, Fragment, type ReactElement, type ReactNode, useContext } from 'react';

import { clsx } from 'clsx';

import * as BaseSelect from '#/components/primitives/select';
import * as styles from '#/components/Select.css';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import ChevronDownIcon from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';

export type SelectItem<Value = string> = BaseSelect.SelectItem<Value>;

const SelectedValueContext = createContext<unknown>(null);
SelectedValueContext.displayName = 'SelectSelectedValueContext';

export type RootProps<Value = string> = {
	children: ReactNode;
	value: Value;
	onValueChange: (value: Value) => void;
	disabled?: boolean;
	/** labels for `Value` and closed-trigger typeahead. */
	items?: SelectItem<Value>[];
};

/** groups the parts of a single-select dropdown. */
export function Root<Value = string>({ children, disabled, items, onValueChange, value }: RootProps<Value>) {
	return (
		<SelectedValueContext.Provider value={value}>
			<BaseSelect.Root items={items} value={value} disabled={disabled} onValueChange={onValueChange}>
				{children}
			</BaseSelect.Root>
		</SelectedValueContext.Provider>
	);
}

export type TriggerProps = {
	children: ReactNode;
	/** space-separated IDs of help or error text (`aria-describedby`). */
	describedBy?: string;
	/** sets `aria-invalid` on the trigger. */
	isInvalid?: boolean;
	/** `aria-label` for the default button. custom triggers must supply their own accessible name. */
	label?: string;
	/** replaces the themed button with a custom trigger element. */
	render?: BaseSelect.TriggerProps['render'];
};

/** dropdown trigger; compose `Value` and `Icon` as children. */
export function Trigger({ children, describedBy, isInvalid, label, render }: TriggerProps) {
	const aria = { 'aria-describedby': describedBy, 'aria-invalid': isInvalid };

	if (render) {
		return (
			<BaseSelect.Trigger {...aria} render={render}>
				{children}
			</BaseSelect.Trigger>
		);
	}
	return (
		<BaseSelect.Trigger {...aria} aria-label={label} className={styles.trigger}>
			{children}
		</BaseSelect.Trigger>
	);
}

export type ValueProps = {
	placeholder?: string;
	className?: string;
	/** formats the selected value; defaults to the matched item's label. */
	children?: (value: string) => ReactNode;
};

/** shows the selection, or `placeholder` when nothing is selected. */
export function Value({ children, className, placeholder }: ValueProps) {
	return (
		<BaseSelect.Value className={clsx(styles.value, className)} placeholder={placeholder}>
			{children}
		</BaseSelect.Value>
	);
}

export type IconProps = {
	className?: string;
};

/** dropdown chevron. */
export function Icon({ className }: IconProps) {
	return (
		<BaseSelect.Icon className={clsx(styles.icon, className)}>
			<ChevronDownIcon className={styles.chevronIcon} />
		</BaseSelect.Icon>
	);
}

export type ContentProps<Value = string> = {
	/** horizontal alignment with the trigger; defaults to `center`. */
	align?: BaseSelect.Align;
	items: SelectItem<Value>[];
	/** minimum width matches the trigger; defaults to `true`. */
	matchTriggerWidth?: boolean;
	/** renders each option with the current selection. */
	renderItem: (item: SelectItem<Value>, selectedValue: Value) => ReactElement;
};

/** portaled option list. */
export function Content<Value = string>({
	align,
	items,
	matchTriggerWidth = true,
	renderItem,
}: ContentProps<Value>) {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- context can't carry `Root`'s generic
	const selectedValue = useContext(SelectedValueContext) as Value;
	return (
		<BaseSelect.Portal>
			<BaseSelect.Positioner
				className={styles.positioner({ matchTriggerWidth })}
				align={align}
				sideOffset={5}
				alignItemWithTrigger={false}
			>
				<BaseSelect.Popup className={styles.popup}>
					{items.map((item) => (
						<Fragment key={String(item.value)}>{renderItem(item, selectedValue)}</Fragment>
					))}
				</BaseSelect.Popup>
			</BaseSelect.Positioner>
		</BaseSelect.Portal>
	);
}

export type ItemProps<Value = string> = {
	children: ReactNode;
	value: Value;
	/** text matched by keyboard typeahead. */
	label: string;
	className?: string;
};

/** an option within `Content`. */
export function Item<Value = string>({ children, className, label, value }: ItemProps<Value>) {
	return (
		<BaseSelect.Item value={value} label={label} className={clsx(styles.item, className)}>
			{children}
		</BaseSelect.Item>
	);
}

/** selection checkmark in the item's gutter. */
export function ItemIndicator() {
	return (
		<BaseSelect.ItemIndicator className={styles.indicator}>
			<CheckIcon className={styles.checkIcon} />
		</BaseSelect.ItemIndicator>
	);
}

/** option label. */
export function ItemText({ children }: { children: ReactNode }) {
	return <BaseSelect.ItemText>{children}</BaseSelect.ItemText>;
}
