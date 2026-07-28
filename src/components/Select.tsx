import { createContext, Fragment, type ReactElement, type ReactNode, useContext } from 'react';

import { Select as BaseSelect } from '@base-ui/react/select';
import { clsx } from 'clsx';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import {
	ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
	ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron';
import * as styles from '#/components/Select.css';

export type SelectItem<Value = string> = {
	label: string;
	value: Value;
};

// feeds the current value to `Content`'s `renderItem` so consumers can style an item against the
// selection (Base UI only exposes per-item `data-selected`, not the value, inside the render closure).
const SelectedValueContext = createContext<unknown>(null);
SelectedValueContext.displayName = 'SelectSelectedValueContext';

export type RootProps<Value = string> = {
	children: ReactNode;
	value: Value;
	onValueChange: (value: Value) => void;
	disabled?: boolean;
	/** The option list. Required for `Value` to auto-render the selected item's label. */
	items?: SelectItem<Value>[];
};

/** Groups the parts of a single-select dropdown built on Base UI's Select. */
export function Root<Value = string>({ children, disabled, items, onValueChange, value }: RootProps<Value>) {
	return (
		<SelectedValueContext.Provider value={value}>
			<BaseSelect.Root
				items={items}
				value={value}
				disabled={disabled}
				onValueChange={(next) => {
					if (next !== null) {
						onValueChange(next);
						return;
					}
					// Base UI reports `null` both for a cleared selection and for an option carrying `null`.
					// reading the value back off the option is what keeps it typed as `Value`.
					const nullItem = items?.find((item) => item.value === null);
					if (nullItem) {
						onValueChange(nullItem.value);
					}
				}}
			>
				{children}
			</BaseSelect.Root>
		</SelectedValueContext.Provider>
	);
}

export type TriggerProps = {
	children: ReactNode;
	/**
	 * Accessible name, applied as `aria-label` to the default trigger button. Omit when `render` supplies an
	 * element that carries its own label.
	 */
	label?: string;
	/**
	 * replaces the default themed button with a custom web-native element. prefer the children form for the
	 * common case; reach for `render` only to supply a custom trigger element.
	 */
	render?: BaseSelect.Trigger.Props['render'];
};

/** The button that opens the dropdown. Compose `Value` + `Icon` inside, or pass a custom `render` element. */
export function Trigger({ children, label, render }: TriggerProps) {
	if (render) {
		return <BaseSelect.Trigger render={render}>{children}</BaseSelect.Trigger>;
	}
	return (
		<BaseSelect.Trigger aria-label={label} className={styles.trigger}>
			{children}
		</BaseSelect.Trigger>
	);
}

export type ValueProps = {
	placeholder?: string;
	className?: string;
	/** Custom formatter for the selected value; defaults to the matched item's label. */
	children?: (value: string) => ReactNode;
};

/** Shows the selected item's label (or `placeholder` when nothing is selected). */
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

/** The chevron affordance inside the trigger. */
export function Icon({ className }: IconProps) {
	return (
		<BaseSelect.Icon className={clsx(styles.icon, className)}>
			<ChevronDownIcon size="xs" fill="currentColor" />
		</BaseSelect.Icon>
	);
}

export type ContentProps<Value = string> = {
	/** How the popup aligns to the trigger along its width. Defaults to Base UI's `center`. */
	align?: 'center' | 'end' | 'start';
	/** The options to render. */
	items: SelectItem<Value>[];
	/** stretch the popup to at least the trigger's width. pass `false` to size it to its content instead. */
	matchTriggerWidth?: boolean;
	/** Renders one option; receives the current selection so an item can style itself against it. */
	renderItem: (item: SelectItem<Value>, selectedValue: Value) => ReactElement;
};

/** The portalled, positioned popup that holds the option list. */
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
				className={styles.positioner}
				align={align}
				sideOffset={5}
				alignItemWithTrigger={false}
			>
				<BaseSelect.Popup className={styles.popup({ matchTriggerWidth })}>
					<BaseSelect.ScrollUpArrow className={styles.scrollUpArrow}>
						<ChevronUpIcon size="xs" fill="currentColor" />
					</BaseSelect.ScrollUpArrow>
					<BaseSelect.List className={styles.list}>
						{items.map((item) => (
							<Fragment key={String(item.value)}>{renderItem(item, selectedValue)}</Fragment>
						))}
					</BaseSelect.List>
					<BaseSelect.ScrollDownArrow className={styles.scrollDownArrow}>
						<ChevronDownIcon size="xs" fill="currentColor" />
					</BaseSelect.ScrollDownArrow>
				</BaseSelect.Popup>
			</BaseSelect.Positioner>
		</BaseSelect.Portal>
	);
}

export type ItemProps<Value = string> = {
	children: ReactNode;
	value: Value;
	/** Text used for keyboard typeahead; defaults to the item's text content. */
	label: string;
	className?: string;
};

/** A single option within `Content`. */
export function Item<Value = string>({ children, className, label, value }: ItemProps<Value>) {
	return (
		<BaseSelect.Item value={value} label={label} className={clsx(styles.item, className)}>
			{children}
		</BaseSelect.Item>
	);
}

/** The selection checkmark, absolutely positioned in the item's gutter. */
export function ItemIndicator() {
	return (
		<BaseSelect.ItemIndicator className={styles.indicator}>
			<CheckIcon size="sm" fill="currentColor" />
		</BaseSelect.ItemIndicator>
	);
}

/** The option's text label. */
export function ItemText({ children }: { children: ReactNode }) {
	return <BaseSelect.ItemText>{children}</BaseSelect.ItemText>;
}
