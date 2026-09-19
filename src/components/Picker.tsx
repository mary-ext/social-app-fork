'use no memo'; // composition props usually invalidate the generated wrapper caches

import { createContext, type ReactNode, use } from 'react';

import { Combobox } from '@base-ui/react/combobox';

import * as Dialog from '#/components/Dialog';
import * as SearchField from '#/components/forms/SearchField';
import * as styles from '#/components/Picker.css';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

type SearchContextValue = {
	searchText: string;
	onSearchTextChange: (value: string) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);
SearchContext.displayName = 'PickerSearchContext';

/**
 * searchable multi-select picker for a dialog with `scroll="body"`. compose with {@link Search} and
 * {@link List}; the caller filters `items`.
 *
 * @param props.children dialog header, search field and list
 * @param props.isItemEqualToValue compares item identity
 * @param props.items rows currently shown, in order
 * @param props.itemToStringLabel text announced for an item
 * @param props.onSearchTextChange called as the user types or clears the search
 * @param props.onValueChange receives the updated selection
 * @param props.searchText controlled search text
 * @param props.value selected entries
 * @returns the picker root
 */
export function Root<Item>({
	children,
	isItemEqualToValue,
	items,
	itemToStringLabel,
	onSearchTextChange,
	onValueChange,
	searchText,
	value,
}: {
	children: ReactNode;
	isItemEqualToValue: (item: Item, value: Item) => boolean;
	items: Item[];
	itemToStringLabel: (item: Item) => string;
	onSearchTextChange: (value: string) => void;
	onValueChange: (value: Item[]) => void;
	searchText: string;
	value: Item[];
}) {
	return (
		<SearchContext.Provider value={{ searchText, onSearchTextChange }}>
			<Combobox.Root
				filter={null}
				inline
				inputValue={searchText}
				isItemEqualToValue={isItemEqualToValue}
				items={items}
				itemToStringLabel={itemToStringLabel}
				multiple
				onInputValueChange={(next, details) => {
					// ignore Base UI's selection-triggered input clear so users can select more matches.
					if (details.reason !== 'input-change') {
						return;
					}
					onSearchTextChange(next);
				}}
				onValueChange={onValueChange}
				open
				value={value}
			>
				{children}
			</Combobox.Root>
		</SearchContext.Provider>
	);
}

/**
 * pinned search field with arrow-key list navigation. requires {@link Root}.
 *
 * @param props.label accessible name of the field
 * @param props.placeholder placeholder text
 * @returns the search row
 * @throws if rendered outside {@link Root}
 */
export function Search({ label, placeholder }: { label: string; placeholder: string }) {
	const context = use(SearchContext);
	if (!context) {
		throw new Error(`Picker.Search must be used within Picker.Root`);
	}
	const { onSearchTextChange, searchText } = context;

	return (
		<Dialog.Search>
			<SearchField.Root shape="round">
				<SearchField.Icon />
				<Combobox.Input
					render={<SearchField.Input aria-label={label} autoFocus maxLength={50} placeholder={placeholder} />}
				/>
				{searchText.length > 0 && (
					<SearchField.Clear
						label={m['common.search.action.clear']()}
						onClick={() => onSearchTextChange('')}
					/>
				)}
			</SearchField.Root>
		</Dialog.Search>
	);
}

/**
 * scrollable picker list.
 *
 * @param props.children {@link Item} rows, or a function rendering one per item
 * @param props.header content above the rows
 * @returns the list region
 */
export function List({
	children,
	header,
}: {
	children: Combobox.List.Props['children'];
	header?: ReactNode;
}) {
	return (
		// the search field drives list navigation, so keep the scroller out of the tab order.
		<Dialog.Body className={styles.list} tabIndex={-1}>
			{header}
			<Combobox.List>{children}</Combobox.List>
		</Dialog.Body>
	);
}

/**
 * selectable row with caller-provided content.
 *
 * @param props.children row content, including {@link Check} or {@link Pending}
 * @param props.value entry toggled by pressing the row
 * @returns the row
 */
export function Item({ children, value }: { children: ReactNode; value: unknown }) {
	return (
		<Combobox.Item className={styles.item} value={value}>
			{children}
		</Combobox.Item>
	);
}

/**
 * selection indicator for a picker row.
 *
 * @returns a checkmark when selected
 */
export function Check() {
	return (
		<span className={styles.indicator}>
			<Combobox.ItemIndicator className={styles.indicatorInner}>
				<CheckIcon className={styles.checkIcon} />
			</Combobox.ItemIndicator>
		</span>
	);
}

/**
 * replaces {@link Check} while saving a selection.
 *
 * @param props.label accessible name of the spinner
 * @returns the spinner slot
 */
export function Pending({ label }: { label: string }) {
	return (
		<span className={styles.indicator}>
			<Spinner color="default" label={label} size="sm" />
		</span>
	);
}

/**
 * empty-state message.
 *
 * @param props.message text to display
 * @returns the empty state
 */
export function Empty({ message }: { message: string }) {
	return (
		<div className={styles.empty}>
			<Text className={styles.emptyMessage} color="textContrastHigh" size="sm">
				{message}
			</Text>
			<Text color="textContrastLow" size="xs">
				(╯°□°)╯︵ ┻━┻
			</Text>
		</div>
	);
}
