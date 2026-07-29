import { Fragment, type ReactElement, type ReactNode } from 'react';

import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { clsx } from 'clsx';

import * as styles from '#/components/Combobox.css';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';

export type ComboboxItem<Value = string> = {
	label: string;
	value: Value;
};

export const resolveItem = <Value,>(
	items: ComboboxItem<Value>[],
	value: Value | undefined,
): ComboboxItem<Value> | null => {
	if (value === undefined) {
		return null;
	}
	return items.find((item) => item.value === value) ?? { label: String(value), value: value };
};

export type RootProps<Value = string> = {
	children: ReactNode;
	filter?: (item: ComboboxItem<Value>, query: string) => boolean;
	items: ComboboxItem<Value>[];
	onValueChange: (value: Value) => void;
	value: Value | undefined;
};

export function Root<Value = string>({ children, filter, items, onValueChange, value }: RootProps<Value>) {
	return (
		<BaseCombobox.Root<ComboboxItem<Value>>
			filter={filter}
			isItemEqualToValue={(a, b) => a.value === b.value}
			items={items}
			onValueChange={(next) => {
				if (next !== null) {
					onValueChange(next.value);
				}
			}}
			// Base UI tracks the selection as one of the item objects, so a value the list doesn't carry needs a
			// stand-in rather than reading as an empty selection
			value={resolveItem(items, value)}
		>
			{children}
		</BaseCombobox.Root>
	);
}

export type TriggerProps = {
	children: ReactNode;
	render: BaseCombobox.Trigger.Props['render'];
};

export function Trigger({ children, render }: TriggerProps) {
	return <BaseCombobox.Trigger render={render}>{children}</BaseCombobox.Trigger>;
}

export type ContentProps<Value = string> = {
	align?: 'center' | 'end' | 'start';
	emptyText: string;
	renderItem: (item: ComboboxItem<Value>) => ReactElement;
	searchPlaceholder: string;
};

export function Content<Value = string>({
	align,
	emptyText,
	renderItem,
	searchPlaceholder,
}: ContentProps<Value>) {
	return (
		<BaseCombobox.Portal>
			<BaseCombobox.Positioner align={align} className={styles.positioner} sideOffset={5}>
				<BaseCombobox.Popup className={styles.popup}>
					<BaseCombobox.Input className={styles.search} placeholder={searchPlaceholder} />
					{/* must stay mounted to keep being announced; Base UI empties its children when there are matches */}
					<BaseCombobox.Empty className={styles.empty}>{emptyText}</BaseCombobox.Empty>
					<BaseCombobox.List className={styles.list}>
						{(item: ComboboxItem<Value>) => <Fragment key={String(item.value)}>{renderItem(item)}</Fragment>}
					</BaseCombobox.List>
				</BaseCombobox.Popup>
			</BaseCombobox.Positioner>
		</BaseCombobox.Portal>
	);
}

export type ItemProps<Value = string> = {
	children: ReactNode;
	className?: string;
	value: ComboboxItem<Value>;
};

export function Item<Value = string>({ children, className, value }: ItemProps<Value>) {
	return (
		<BaseCombobox.Item className={clsx(styles.item, className)} value={value}>
			{children}
		</BaseCombobox.Item>
	);
}

export function ItemIndicator() {
	return (
		<BaseCombobox.ItemIndicator className={styles.indicator}>
			<CheckIcon fill="currentColor" size="sm" />
		</BaseCombobox.ItemIndicator>
	);
}
