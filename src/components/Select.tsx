import {
	type ComponentType,
	createContext,
	Fragment,
	type ReactElement,
	type ReactNode,
	useContext,
} from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { clsx } from 'clsx';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import {
	ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
	ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron';
import type { Props as SVGIconProps } from '#/components/icons/common';
import * as styles from '#/components/Select.css';

export type SelectItem = {
	label: string;
	value: string;
};

// feeds the current value to `Content`'s `renderItem` so consumers can style an item against the
// selection (Base UI only exposes per-item `data-selected`, not the value, inside the render closure).
const SelectedValueContext = createContext<string | null>(null);
SelectedValueContext.displayName = 'SelectSelectedValueContext';

export type RootProps = {
	children: ReactNode;
	value: string;
	onValueChange: (value: string) => void;
	disabled?: boolean;
	/** The option list. Required for `Value` to auto-render the selected item's label. */
	items?: SelectItem[];
};

/** Groups the parts of a single-select dropdown built on Base UI's Select. */
export function Root({ children, disabled, items, onValueChange, value }: RootProps) {
	return (
		<SelectedValueContext.Provider value={value}>
			<BaseSelect.Root
				items={items}
				value={value}
				disabled={disabled}
				onValueChange={(next) => onValueChange(next as string)}
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
	 * Replaces the default themed button with a custom web-native element (e.g. `web/Button`). Prefer the
	 * children form for the common case; reach for `render` only to supply a custom trigger element.
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

export type ContentProps<T> = {
	/** The options to render. Recommended shape `{ label, value }`; otherwise pass `valueExtractor`. */
	items: T[];
	/** Renders one option; receives the current selection so an item can style itself against it. */
	renderItem: (item: T, index: number, selectedValue: string | null) => ReactElement;
	/** Extracts an item's value. Defaults to `item => item.value`. */
	valueExtractor?: (item: T) => string;
};

/** The portalled, positioned popup that holds the option list. */
export function Content<T>({ items, renderItem, valueExtractor = defaultValueExtractor }: ContentProps<T>) {
	const selectedValue = useContext(SelectedValueContext);
	return (
		<BaseSelect.Portal>
			<BaseSelect.Positioner className={styles.positioner} sideOffset={5} alignItemWithTrigger={false}>
				<BaseSelect.Popup className={styles.popup}>
					<BaseSelect.ScrollUpArrow className={styles.scrollUpArrow}>
						<ChevronUpIcon size="xs" fill="currentColor" />
					</BaseSelect.ScrollUpArrow>
					<BaseSelect.List className={styles.list}>
						{items.map((item, index) => (
							<Fragment key={valueExtractor(item)}>{renderItem(item, index, selectedValue)}</Fragment>
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

function defaultValueExtractor(item: unknown) {
	return (item as { value: string }).value;
}

export type ItemProps = {
	children: ReactNode;
	value: string;
	/** Text used for keyboard typeahead; defaults to the item's text content. */
	label: string;
	className?: string;
};

/** A single option within `Content`. */
export function Item({ children, className, label, value }: ItemProps) {
	return (
		<BaseSelect.Item value={value} label={label} className={clsx(styles.item, className)}>
			{children}
		</BaseSelect.Item>
	);
}

/** The selection checkmark, absolutely positioned in the item's gutter. */
export function ItemIndicator({ icon: Icon = CheckIcon }: { icon?: ComponentType<SVGIconProps> }) {
	return (
		<BaseSelect.ItemIndicator className={styles.indicator}>
			<Icon size="sm" fill="currentColor" />
		</BaseSelect.ItemIndicator>
	);
}

/** The option's text label. */
export function ItemText({ children }: { children: ReactNode }) {
	return <BaseSelect.ItemText>{children}</BaseSelect.ItemText>;
}

export type SelectProps = {
	/** Accessible name for the trigger. */
	label: string;
	items: SelectItem[];
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
};

/** A terse convenience wrapper over the compound parts for the common `{ label, value }[]` dropdown. */
export function Select({ disabled, items, label, onValueChange, placeholder, value }: SelectProps) {
	return (
		<Root items={items} value={value} disabled={disabled} onValueChange={onValueChange}>
			<Trigger label={label}>
				<Value placeholder={placeholder} />
				<Icon />
			</Trigger>
			<Content
				items={items}
				renderItem={({ label, value }) => (
					<Item value={value} label={label}>
						<ItemIndicator />
						<ItemText>{label}</ItemText>
					</Item>
				)}
			/>
		</Root>
	);
}
