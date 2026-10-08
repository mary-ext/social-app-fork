'use no memo'; // composition props usually invalidate the generated wrapper caches

import {
	type FocusEvent,
	type ReactNode,
	type Ref,
	useId,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { useConstant } from '#/lib/hooks/use-constant';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { usePresence } from '../presence';
import {
	createHighlightStore,
	type HighlightDetails,
	type HighlightReason,
	type InputValueChangeDetails,
	type ItemPressDetails,
	type OpenChangeDetails,
	RootContext,
	type RootContextValue,
	type SelectionMode,
} from './shared';

type SelectionProps<Item> =
	| {
			multiple?: undefined;
			value?: undefined;
			onValueChange?: undefined;
	  }
	| {
			multiple?: false;
			value: NoInfer<Item> | null;
			/** called when the user presses an unselected item. */
			onValueChange: (value: NoInfer<Item>) => void;
	  }
	| {
			multiple: true;
			value: readonly NoInfer<Item>[];
			/** receives the selection with the pressed item toggled. */
			onValueChange: (value: NoInfer<Item>[]) => void;
	  };

export type RootProps<Item> = SelectionProps<Item> & {
	children?: ReactNode;
	/** items currently shown, in order; the caller filters them. */
	items: readonly Item[];
	inputValue: string;
	/** called as the user types or presses `Clear`. */
	onInputValueChange: (value: string, details: InputValueChangeDetails) => void;
	/** whether the popup is shown. omit to render the list inline, always shown. */
	open?: boolean;
	/** receives open and close requests for the popup. */
	onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
	/**
	 * `true` highlights the first item on non-empty input changes and keeps it when the text is deleted.
	 * `'always'` falls back to the first item whenever no item is highlighted, even without input focus.
	 * `Clear` resets the highlight unless set to `'always'`.
	 */
	autoHighlight?: boolean | 'always';
	/** navigates items in `Row`s with all four arrow keys. */
	grid?: boolean;
	/** receives highlight changes, with `undefined` once cleared. */
	onItemHighlighted?: (item: Item | undefined, details: HighlightDetails) => void;
	/** called on click or Enter, after any selection change. Enter also activates unmounted virtualized items. */
	onItemPress?: (item: Item, details: ItemPressDetails) => void;
	/** matches item values against `items` and the selection; defaults to `Object.is`. */
	isItemEqualToValue?: (item: Item, value: Item) => boolean;
	actionsRef?: Ref<Actions>;
};

export type Actions = {
	/**
	 * highlights an item without scrolling to it.
	 *
	 * @param index item index, or `-1` to clear the highlight
	 */
	setActiveIndex(index: number): void;
};

type Matcher = (item: unknown, value: unknown) => boolean;

const toMatcher = (isEqual: Matcher): Matcher => {
	return (item, value) => (item == null || value == null ? Object.is(item, value) : isEqual(item, value));
};

/**
 * manages optional single or multiple selection. item presses preserve the input text and open state.
 *
 * @param props combobox parts, items, input text, and selection
 * @returns the combobox parts without a wrapper element
 */
export const Root = <Item,>({
	children,
	items,
	inputValue,
	onInputValueChange,
	open,
	onOpenChange,
	autoHighlight = false,
	grid = false,
	onItemHighlighted,
	onItemPress,
	isItemEqualToValue = Object.is,
	actionsRef,
	...selection
}: RootProps<Item>) => {
	const inline = open === undefined;
	const expanded = open ?? true;
	const { mounted, onTransitionSettled } = usePresence(expanded, undefined);

	const id = useId();
	const inputId = `${id}input`;
	const listId = `${id}list`;
	const itemIdPrefix = `${id}item-`;

	const inputRef = useRef<HTMLElement | null>(null);
	const listRef = useRef<HTMLElement | null>(null);
	const positionerRef = useRef<HTMLElement | null>(null);
	const scrollRequestRef = useRef(-1);
	const reasonRef = useRef<HighlightReason>('none');
	const blurredIndexRef = useRef(-1);
	const highlight = useConstant(createHighlightStore);

	const [rawIndex, setRawIndex] = useState(-1);

	const [prevExpanded, setPrevExpanded] = useState(expanded);
	if (expanded !== prevExpanded) {
		setPrevExpanded(expanded);
		if (expanded) {
			setRawIndex(-1);
		}
	}
	// keep the index while items are empty, so an auto-highlight survives pending results.
	if (rawIndex >= items.length && items.length > 0) {
		setRawIndex(-1);
	}

	let activeIndex = rawIndex < items.length ? rawIndex : -1;
	if (activeIndex === -1 && autoHighlight === 'always' && items.length > 0) {
		activeIndex = 0;
	}
	if (!expanded) {
		activeIndex = -1;
	}

	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- parts pass values of `items`; context erases `Item`
	const isEqual = isItemEqualToValue as Matcher;

	let selectionMode: SelectionMode;
	if (selection.onValueChange === undefined) {
		selectionMode = 'none';
	} else {
		selectionMode = selection.multiple ? 'multiple' : 'single';
	}

	const setActiveIndex = useNonReactiveCallback((index: number, reason: HighlightReason) => {
		reasonRef.current = reason;
		scrollRequestRef.current = reason === 'keyboard' ? index : -1;
		setRawIndex(index);
	});

	useImperativeHandle(
		actionsRef,
		() => ({
			setActiveIndex(index) {
				setActiveIndex(index, 'none');
			},
		}),
		[setActiveIndex],
	);

	const takeScrollRequest = useNonReactiveCallback((index: number) => {
		if (scrollRequestRef.current !== index) {
			return false;
		}
		scrollRequestRef.current = -1;
		return true;
	});

	const activeItem = activeIndex === -1 ? undefined : items[activeIndex];
	// don't emit an initial cleared highlight.
	const emittedRef = useRef<{ index: number; item: Item | undefined }>({ index: -1, item: undefined });
	const emitHighlight = useNonReactiveCallback((index: number, item: Item | undefined) => {
		const emitted = emittedRef.current;
		if (emitted.index === index && Object.is(emitted.item, item)) {
			return;
		}
		emittedRef.current = { index, item };
		const reason = reasonRef.current;
		reasonRef.current = 'none';
		const rendered = index !== -1 && document.getElementById(`${itemIdPrefix}${index}`) !== null;
		onItemHighlighted?.(item, { reason, index, rendered });
	});
	useLayoutEffect(() => {
		highlight.set(activeIndex);
		emitHighlight(activeIndex, activeItem);
	}, [highlight, activeIndex, activeItem, emitHighlight]);

	const resetScroll = () => {
		// the list's nearest scroller, without leaving the dialog or popup.
		for (let el = listRef.current; el; el = el.parentElement) {
			if (el.scrollHeight > el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY)) {
				el.scrollTop = 0;
				return;
			}
			if (el === positionerRef.current || el.matches('[role="dialog"]')) {
				return;
			}
		}
	};

	const setInputValue = useNonReactiveCallback((value: string, details: InputValueChangeDetails) => {
		onInputValueChange(value, details);

		switch (details.reason) {
			case 'clear-press': {
				setActiveIndex(-1, 'none');
				return;
			}
			case 'input-change': {
				if (!autoHighlight) {
					setActiveIndex(-1, 'none');
				} else if (autoHighlight === 'always' || value.trim() !== '') {
					setActiveIndex(0, 'none');
				}
				resetScroll();
				return;
			}
		}
	});

	const press = useNonReactiveCallback((value: unknown, details: ItemPressDetails) => {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- items carry `Root`'s `Item`; context erases it
		const item = value as Item;
		const matches = toMatcher(isEqual);
		switch (selection.multiple) {
			case undefined:
			case false: {
				if (selection.onValueChange && !matches(item, selection.value)) {
					selection.onValueChange(item);
				}
				break;
			}
			case true: {
				const current = selection.value;
				const next = current.some((other) => matches(item, other))
					? current.filter((other) => !matches(item, other))
					: [...current, item];
				selection.onValueChange(next);
				break;
			}
		}
		onItemPress?.(item, details);
	});

	const requestOpenChange = useNonReactiveCallback((next: boolean, details: OpenChangeDetails) => {
		if (!inline && next !== open) {
			onOpenChange?.(next, details);
		}
	});

	const onInputFocus = useNonReactiveCallback(() => {
		// an inline list restores the highlight it hid on blur.
		if (inline && rawIndex === -1 && blurredIndexRef.current !== -1) {
			setActiveIndex(blurredIndexRef.current, 'none');
			blurredIndexRef.current = -1;
		}
	});

	const onInputBlur = useNonReactiveCallback((event: FocusEvent) => {
		if (!inline) {
			const related = event.relatedTarget;
			if (!(related instanceof Node && positionerRef.current?.contains(related))) {
				requestOpenChange(false, { reason: 'focus-out', event: event.nativeEvent });
			}
			return;
		}
		if (autoHighlight !== 'always') {
			blurredIndexRef.current = rawIndex;
			setActiveIndex(-1, 'none');
		}
	});

	const selected = selection.value;
	const multiple = selection.multiple;
	const ctx = useMemo((): RootContextValue => {
		const matches = toMatcher(isEqual);
		const indexByItem = new Map<unknown, number>();
		for (const [index, item] of items.entries()) {
			if (!indexByItem.has(item)) {
				indexByItem.set(item, index);
			}
		}

		return {
			items,
			inline,
			expanded,
			mounted,
			grid,
			selectionMode,
			inputValue,
			highlight,
			inputId,
			listId,
			inputRef,
			listRef,
			positionerRef,
			takeScrollRequest,
			indexOf(value) {
				return indexByItem.get(value) ?? items.findIndex((item) => matches(item, value));
			},
			getItemId(index) {
				return `${itemIdPrefix}${index}`;
			},
			getItemIndex(element) {
				return element.id.startsWith(itemIdPrefix) ? Number(element.id.slice(itemIdPrefix.length)) : -1;
			},
			isSelected(value) {
				if (multiple) {
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `multiple` selects an array
					return (selected as readonly unknown[]).some((other) => matches(value, other));
				}
				return selected != null && matches(value, selected);
			},
			press,
			setActiveIndex,
			setInputValue,
			requestOpenChange,
			onInputFocus,
			onInputBlur,
			onTransitionSettled,
		};
	}, [
		items,
		inline,
		expanded,
		mounted,
		grid,
		selectionMode,
		inputValue,
		highlight,
		inputId,
		listId,
		itemIdPrefix,
		isEqual,
		selected,
		multiple,
		takeScrollRequest,
		press,
		setActiveIndex,
		setInputValue,
		requestOpenChange,
		onInputFocus,
		onInputBlur,
		onTransitionSettled,
	]);

	return <RootContext.Provider value={ctx}>{children}</RootContext.Provider>;
};
