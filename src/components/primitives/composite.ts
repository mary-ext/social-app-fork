import {
	createContext,
	type FocusEvent,
	type KeyboardEvent,
	type MouseEvent,
	type PointerEvent,
	useContext,
	useId,
	useLayoutEffect,
	useReducer,
	useState,
} from 'react';

import type { PrimitiveEvent } from './merge-props';

// context ids isolate nested composites and let toggle groups join a toolbar's navigation.
const ITEM_ATTR = 'data-composite-item';
const KEY_ATTR = 'data-composite-key';
const ACTIVE_ATTR = 'data-composite-active';

export type Orientation = 'horizontal' | 'vertical';

export type CompositeOrientation = Orientation | 'both';

export type CompositeContextValue = {
	id: string;
	tabStop: string | null;
	tabbable: boolean;
	invalidate: () => void;
};

const CompositeContext = createContext<CompositeContextValue | null>(null);
CompositeContext.displayName = 'CompositeContext';

/** provides a composite to its items. */
export const CompositeProvider = CompositeContext.Provider;

const getItems = (id: string): HTMLElement[] => {
	return Array.from(document.querySelectorAll<HTMLElement>(`[${ITEM_ATTR}="${CSS.escape(id)}"]`));
};

const isItemOf = (target: EventTarget, id: string): target is HTMLElement => {
	return target instanceof HTMLElement && target.getAttribute(ITEM_ATTR) === id;
};

const canFocus = (item: HTMLElement): boolean => {
	return !item.matches(':disabled') && item.checkVisibility();
};

const isEnabled = (item: HTMLElement): boolean => {
	return canFocus(item) && item.getAttribute('aria-disabled') !== 'true';
};

const getStep = (key: string, orientation: CompositeOrientation, rtl: boolean): 1 | -1 | null => {
	switch (key) {
		case 'ArrowRight':
		case 'ArrowLeft': {
			if (orientation === 'vertical') {
				return null;
			}
			return (key === 'ArrowRight') !== rtl ? 1 : -1;
		}
		case 'ArrowDown':
		case 'ArrowUp': {
			if (orientation === 'horizontal') {
				return null;
			}
			return key === 'ArrowDown' ? 1 : -1;
		}
	}
	return null;
};

export type CompositeRootOptions = {
	/** arrow keys that move focus; `both` accepts either axis. */
	orientation: CompositeOrientation;
	/** wraps focus at either end. */
	loopFocus: boolean;
	/** moves focus to the first and last items with Home and End. */
	homeEnd: boolean;
	/** keeps the tab stop in the tab order; otherwise every item has `tabIndex: -1`. */
	tabbable: boolean;
};

/**
 * manages a roving tab stop for {@link useCompositeItem}. prefers the focused, active, last focused, then
 * first enabled item. `aria-disabled` items remain arrow-key reachable but aren't fallback tab stops.
 *
 * @param options navigation behavior
 * @returns context for `CompositeProvider` and handlers for the root element
 */
export const useCompositeRoot = ({
	orientation,
	loopFocus,
	homeEnd,
	tabbable,
}: CompositeRootOptions): {
	context: CompositeContextValue;
	props: {
		onFocus: (event: FocusEvent<HTMLElement>) => void;
		onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
	};
} => {
	const id = useId();
	const [tabStop, setTabStop] = useState<string | null>(null);
	// item changes can occur without a root render.
	const [, invalidate] = useReducer((count: number) => count + 1, 0);

	// item order and visibility come from the committed DOM.
	// oxlint-disable-next-line react-hooks/exhaustive-deps -- runs after every render on purpose
	useLayoutEffect(() => {
		const items = getItems(id);
		const focused = items.find((item) => item === document.activeElement);
		const current = items.find((item) => item.getAttribute(KEY_ATTR) === tabStop);
		const next =
			focused ??
			items.find((item) => item.hasAttribute(ACTIVE_ATTR) && isEnabled(item)) ??
			(current && isEnabled(current) ? current : undefined) ??
			items.find(isEnabled);

		const nextKey = next?.getAttribute(KEY_ATTR) ?? null;
		if (nextKey !== tabStop) {
			// oxlint-disable-next-line react/set-state-in-effect -- derived from the committed DOM
			setTabStop(nextKey);
		}
	});

	return {
		context: { id, tabStop, tabbable, invalidate },
		props: {
			onFocus(event) {
				if (isItemOf(event.target, id)) {
					setTabStop(event.target.getAttribute(KEY_ATTR));
				}
			},
			onKeyDown(event) {
				const { key, target } = event;
				// portaled popup and nested composite events also bubble to this root.
				if (
					event.defaultPrevented ||
					event.nativeEvent.isComposing ||
					event.altKey ||
					event.ctrlKey ||
					event.metaKey ||
					event.shiftKey ||
					!isItemOf(target, id)
				) {
					return;
				}

				const items = getItems(id).filter(canFocus);
				let next: HTMLElement | undefined;
				if (homeEnd && (key === 'Home' || key === 'End')) {
					next = key === 'Home' ? items[0] : items.at(-1);
				} else {
					const step = getStep(key, orientation, target.matches(':dir(rtl)'));
					if (step === null) {
						return;
					}
					next = items[items.indexOf(target) + step];
					if (!next && loopFocus) {
						next = step === 1 ? items[0] : items.at(-1);
					}
				}

				// at an unlooped edge, the key falls through to ancestors.
				if (next && next !== target) {
					event.preventDefault();
					next.focus();
				}
			},
		},
	};
};

export type CompositeItemOptions = {
	/** takes the tab stop while focus is outside the composite. */
	active: boolean;
	/** reports disabled state; also set `disabled` or `aria-disabled` on the element. */
	disabled: boolean;
};

/**
 * registers an element with the enclosing composite.
 *
 * @param options item state
 * @returns props for the item element, or `undefined` outside a composite
 */
export const useCompositeItem = ({ active, disabled }: CompositeItemOptions) => {
	const ctx = useContext(CompositeContext);
	const key = useId();

	const invalidate = ctx?.invalidate;
	useLayoutEffect(() => {
		invalidate?.();
		return () => invalidate?.();
		// oxlint-disable-next-line react/exhaustive-effect-dependencies -- state changes can move the tab stop
	}, [invalidate, active, disabled]);

	if (!ctx) {
		return undefined;
	}

	return {
		[ITEM_ATTR]: ctx.id,
		[KEY_ATTR]: key,
		[ACTIVE_ATTR]: active ? '' : undefined,
		tabIndex: ctx.tabbable && ctx.tabStop === key ? 0 : -1,
	};
};

/** props from {@link useCompositeItem} for an item inside a composite. */
export type CompositeItemProps = NonNullable<ReturnType<typeof useCompositeItem>>;

const block = (event: PrimitiveEvent<MouseEvent<HTMLElement> | PointerEvent<HTMLElement>>) => {
	event.preventDefault();
	event.preventPrimitiveHandler();
};

/** blocks activation while keeping disabled items focusable. merge after consumer props to run first. */
export const focusableDisabledGuard = {
	onClick: block,
	onPointerDown: block,
	onKeyDown(event: PrimitiveEvent<KeyboardEvent<HTMLElement>>) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			event.preventPrimitiveHandler();
		}
	},
};
