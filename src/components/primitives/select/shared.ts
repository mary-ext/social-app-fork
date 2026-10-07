import { createContext, type RefObject, useContext } from 'react';

import type { InteractionType } from '#/lib/browser/input-modality';

import type { Typeahead } from '../list-navigation';

export type OpenChangeReason =
	| 'escape-key'
	| 'focus-out'
	| 'item-press'
	| 'list-navigation'
	| 'outside-press'
	| 'trigger-press';

export type OpenChangeRequest = {
	reason: OpenChangeReason;
	method: InteractionType;
	/** item to focus when opening without a selection. */
	entry?: 'first' | 'last';
};

export type SelectItem<Value> = {
	label: string;
	value: Value;
};

export type RootContextValue = {
	open: boolean;
	mounted: boolean;
	disabled: boolean;
	value: unknown;
	items: readonly SelectItem<unknown>[] | undefined;
	selectedItem: SelectItem<unknown> | undefined;
	placeholder: boolean;
	openMethod: InteractionType;
	openEntry: 'first' | 'last' | undefined;
	anchorName: string;
	triggerId: string;
	popupId: string;
	triggerRef: RefObject<HTMLElement | null>;
	positionerRef: RefObject<HTMLDialogElement | null>;
	popupRef: RefObject<HTMLDivElement | null>;
	typeahead: Typeahead;
	/**
	 * @param open requested open state
	 * @param request reason and interaction details
	 * @returns whether the change was accepted
	 */
	setOpen: (open: boolean, request: OpenChangeRequest) => boolean;
	/** commits a value and closes the popup. */
	select: (value: unknown) => void;
	onTransitionSettled: (open: boolean) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'SelectRootContext';

/**
 * @returns the enclosing select's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`select parts require <Select.Root>`);
	}
	return ctx;
};

export const ItemSelectedContext = createContext<boolean | null>(null);
ItemSelectedContext.displayName = 'SelectItemSelectedContext';

/**
 * @returns whether the enclosing item is selected
 * @throws if called outside `Item`
 */
export const useItemSelected = (): boolean => {
	const selected = useContext(ItemSelectedContext);
	if (selected === null) {
		throw new Error(`item parts require <Select.Item>`);
	}
	return selected;
};

export const SELECTED_ITEM_SELECTOR = '[role="option"][aria-selected="true"]';

/**
 * @param value a selected value
 * @returns whether the value is `null`, `undefined`, or an empty string
 */
export const isEmptyValue = (value: unknown): boolean => {
	return value === null || value === undefined || value === '';
};
