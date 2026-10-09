import { type HTMLAttributes, type KeyboardEvent, type PointerEvent, useState } from 'react';

import { getInputModality, isMouseLike } from '#/lib/browser/input-modality';
import { pressable } from '#/lib/browser/interactive';

// distinct from `data-list-item` so feed navigation excludes nested menu items.
const ITEM_ATTR = 'data-nav-item';
const LABEL_ATTR = 'data-nav-label';
const ITEM_SELECTOR = `[${ITEM_ATTR}]`;

const TYPEAHEAD_RESET = 750;

/**
 * marks an item for arrow-key and typeahead navigation, outside the tab order.
 *
 * @param label text matched by typeahead; defaults to the item's text content
 * @returns attributes for the item element
 */
export const listItemProps = (label?: string) => ({
	[ITEM_ATTR]: '',
	[LABEL_ATTR]: label,
	tabIndex: -1,
});

/**
 * highlights keyboard focus and mouse or pen hover; clears on blur. adds press feedback.
 *
 * @returns highlight state and item props
 */
export const useItemHighlight = (): {
	highlighted: boolean;
	highlightProps: typeof pressable &
		Pick<HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus' | 'onPointerMove'>;
} => {
	const [highlighted, setHighlighted] = useState(false);
	return {
		highlighted,
		highlightProps: {
			...pressable,
			onFocus() {
				// preserve hover highlight when the container moves focus here.
				setHighlighted((prev) => prev || getInputModality() === 'keyboard');
			},
			onBlur() {
				setHighlighted(false);
			},
			onPointerMove(event) {
				if (!highlighted && isHoverMove(event) && !isDisabled(event.currentTarget)) {
					setHighlighted(true);
				}
			},
		},
	};
};

/**
 * @param event pointer move event
 * @returns whether a mouse or pen moved
 */
export const isHoverMove = (event: PointerEvent): boolean => {
	// WebKit fires zero-movement events when scrolling beneath a stationary pointer.
	return isMouseLike(event) && (event.movementX !== 0 || event.movementY !== 0);
};

const isDisabled = (item: HTMLElement): boolean => {
	return item.getAttribute('aria-disabled') === 'true' || item.matches(':disabled');
};

/**
 * @param container element holding the items
 * @returns the enabled items inside the container, in tree order
 */
export const getListItems = (container: Element): HTMLElement[] => {
	return Array.from(container.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
		(item) => !isDisabled(item),
	);
};

const getLabel = (item: HTMLElement): string => {
	return item.getAttribute(LABEL_ATTR) ?? item.textContent;
};

export type Typeahead = {
	/** whether a typed sequence is in progress. */
	readonly active: boolean;
	/**
	 * @param key a single typed character
	 * @param labels candidate labels, in list order; compared case-insensitively
	 * @param current current item index, or `-1`
	 * @returns the matching index, or `-1` if unmatched or Space starts a sequence
	 */
	match(key: string, labels: string[], current: number): number;
};

/**
 * @param event keyboard event to classify
 * @returns whether the key is a character without Ctrl, Meta, or Alt
 */
export const isTypeaheadKey = (event: KeyboardEvent): boolean => {
	return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
};

/** @returns a typeahead whose sequence resets after a pause */
export const createTypeahead = (): Typeahead => {
	let query = '';
	let lastTime = 0;

	return {
		get active() {
			return query !== '' && performance.now() - lastTime < TYPEAHEAD_RESET;
		},
		match(key, labels, current) {
			const now = performance.now();
			if (now - lastTime >= TYPEAHEAD_RESET) {
				query = '';
			}
			if (query === '' && key === ' ') {
				return -1;
			}

			lastTime = now;
			query += key.toLowerCase();

			// repeated keys cycle; longer prefixes can still match the current item.
			const repeating = query.replaceAll(query.charAt(0), '') === '';
			const search = repeating ? query.charAt(0) : query;
			const start = repeating ? current + 1 : Math.max(current, 0);

			for (let offset = 0; offset < labels.length; offset++) {
				const index = (start + offset) % labels.length;
				if (labels[index]?.trim().toLowerCase().startsWith(search)) {
					return index;
				}
			}
			return -1;
		},
	};
};

const focusItem = (item: HTMLElement | undefined, event: KeyboardEvent) => {
	if (item) {
		event.preventDefault();
		item.focus();
	}
};

const getStep = (items: HTMLElement[], target: EventTarget, step: 1 | -1, loop: boolean) => {
	const index = target instanceof HTMLElement ? items.indexOf(target) : -1;
	if (index === -1) {
		return step === 1 ? items[0] : items.at(-1);
	}
	const next = items[index + step];
	if (next || !loop) {
		return next;
	}
	return step === 1 ? items[0] : items.at(-1);
};

export type ListNavigationOptions = {
	/** wraps focus at either end. */
	loop: boolean;
	/** enables typeahead; items must not activate on prevented keydowns. */
	typeahead?: Typeahead;
};

/**
 * navigates enabled items with Up/Down, Home/End, optional typeahead, and mouse or pen hover. moving the
 * pointer off the items returns focus to the container.
 *
 * @param options navigation behavior
 * @returns container props with `tabIndex: -1`
 */
export const getListNavigationProps = ({ loop, typeahead }: ListNavigationOptions) => {
	return {
		tabIndex: -1,
		// consume typeahead before an item's Space handler can activate it.
		onKeyDownCapture(event: KeyboardEvent<HTMLElement>) {
			if (!typeahead || !isTypeaheadKey(event) || event.nativeEvent.isComposing) {
				return;
			}
			const items = getListItems(event.currentTarget);
			const target = event.target;
			const index = target instanceof HTMLElement ? items.indexOf(target) : -1;
			const match = typeahead.match(event.key, items.map(getLabel), index);
			if (match !== -1) {
				focusItem(items[match], event);
			} else if (typeahead.active) {
				event.preventDefault();
			}
		},
		onKeyDown(event: KeyboardEvent<HTMLElement>) {
			if (event.defaultPrevented || event.nativeEvent.isComposing) {
				return;
			}

			switch (event.key) {
				case 'ArrowDown':
				case 'ArrowUp': {
					const items = getListItems(event.currentTarget);
					focusItem(getStep(items, event.target, event.key === 'ArrowDown' ? 1 : -1, loop), event);
					// keep the page from scrolling at the ends.
					event.preventDefault();
					return;
				}
				case 'Home': {
					focusItem(getListItems(event.currentTarget)[0], event);
					return;
				}
				case 'End': {
					focusItem(getListItems(event.currentTarget).at(-1), event);
					return;
				}
			}
		},
		onPointerMove(event: PointerEvent<HTMLElement>) {
			if (!isHoverMove(event)) {
				return;
			}
			const target = event.target;
			const item = target instanceof Element ? target.closest<HTMLElement>(ITEM_SELECTOR) : null;
			if (
				item &&
				item !== document.activeElement &&
				event.currentTarget.contains(item) &&
				!isDisabled(item)
			) {
				item.focus({ preventScroll: true });
			}
		},
		onPointerOut(event: PointerEvent<HTMLElement>) {
			if (!isMouseLike(event)) {
				return;
			}
			const container = event.currentTarget;
			const related = event.relatedTarget;
			if (related instanceof Element && related.closest(ITEM_SELECTOR) && container.contains(related)) {
				return;
			}
			const active = document.activeElement;
			if (active instanceof Element && active.matches(ITEM_SELECTOR) && container.contains(active)) {
				container.focus({ preventScroll: true });
			}
		},
	};
};
