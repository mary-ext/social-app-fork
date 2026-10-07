import { createContext, type FocusEvent, type RefObject, useContext, useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

export type InputValueChangeReason = 'clear-press' | 'input-change';

export type InputValueChangeDetails = {
	reason: InputValueChangeReason;
	event: Event;
};

export type HighlightReason = 'keyboard' | 'none' | 'pointer';

export type HighlightDetails = {
	reason: HighlightReason;
	/** highlighted index, or `-1` when cleared. */
	index: number;
	/** whether the item is mounted; use this to scroll virtualized lists to unmounted items. */
	rendered: boolean;
};

export type ItemPressDetails = {
	/** the item's click, or Enter on the input. */
	event: KeyboardEvent | MouseEvent;
};

export type OpenChangeReason = 'escape-key' | 'focus-out' | 'list-navigation';

export type OpenChangeDetails = {
	reason: OpenChangeReason;
	event: Event;
};

export type SelectionMode = 'multiple' | 'none' | 'single';

export type RootContextValue = {
	items: readonly unknown[];
	inline: boolean;
	/** whether the list is shown. */
	expanded: boolean;
	/** whether the popup is rendered, including during its exit transition. */
	mounted: boolean;
	grid: boolean;
	selectionMode: SelectionMode;
	inputValue: string;
	highlight: HighlightStore;
	inputId: string;
	listId: string;
	inputRef: RefObject<HTMLElement | null>;
	listRef: RefObject<HTMLElement | null>;
	positionerRef: RefObject<HTMLElement | null>;
	/**
	 * @param index a highlighted item's index
	 * @returns whether the item should scroll into view; consumes the request
	 */
	takeScrollRequest: (index: number) => boolean;
	/**
	 * @param value an item's value
	 * @returns the value's position in `items`, or `-1`
	 */
	indexOf: (value: unknown) => number;
	/**
	 * @param index item index
	 * @returns the item element's id
	 */
	getItemId: (index: number) => string;
	/**
	 * @param element an item element
	 * @returns the item's index, or `-1` for elements of other lists
	 */
	getItemIndex: (element: Element) => number;
	isSelected: (value: unknown) => boolean;
	press: (value: unknown, details: ItemPressDetails) => void;
	setActiveIndex: (index: number, reason: HighlightReason) => void;
	setInputValue: (value: string, details: InputValueChangeDetails) => void;
	requestOpenChange: (open: boolean, details: OpenChangeDetails) => void;
	onInputFocus: () => void;
	onInputBlur: (event: FocusEvent) => void;
	onTransitionSettled: (open: boolean) => void;
};

export type HighlightStore = {
	/** @returns the highlighted index, or `-1` */
	get: () => number;
	/** @param index the highlighted index, or `-1` */
	set: (index: number) => void;
	subscribe: (listener: () => void) => () => void;
};

/** @returns a store holding no highlight */
export const createHighlightStore = (): HighlightStore => {
	// separate subscriptions from root context so unchanged items don't re-render.
	const emitter = new SimpleEventEmitter<[]>();
	let current = -1;

	return {
		get: () => current,
		set: (index) => {
			if (index !== current) {
				current = index;
				emitter.emit();
			}
		},
		subscribe: (listener) => emitter.subscribe(listener),
	};
};

/** @returns the highlighted index, or `-1` */
export const useActiveIndex = (): number => {
	const { highlight } = useRootContext();
	return useSyncExternalStore(highlight.subscribe, highlight.get);
};

/**
 * @param index an item's index
 * @returns whether the item is highlighted
 */
export const useHighlighted = (index: number): boolean => {
	const { highlight } = useRootContext();
	return useSyncExternalStore(highlight.subscribe, () => index !== -1 && highlight.get() === index);
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'ComboboxRootContext';

/**
 * @returns the enclosing combobox's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`combobox parts require <Combobox.Root>`);
	}
	return ctx;
};

export const ItemSelectedContext = createContext<boolean | null>(null);
ItemSelectedContext.displayName = 'ComboboxItemSelectedContext';

/**
 * @returns whether the enclosing item is selected
 * @throws if called outside `Item`
 */
export const useItemSelected = (): boolean => {
	const selected = useContext(ItemSelectedContext);
	if (selected === null) {
		throw new Error(`item parts require <Combobox.Item>`);
	}
	return selected;
};

/** whether items render inside a `Row`. */
export const RowContext = createContext(false);
RowContext.displayName = 'ComboboxRowContext';

export const ITEM_SELECTOR = '[role="option"], [role="gridcell"]';
