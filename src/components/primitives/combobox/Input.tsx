'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type InputHTMLAttributes, type KeyboardEvent, useCallback, useState } from 'react';

import type { BaseUIEvent } from '@base-ui/react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { triggerStateAttributes } from '../presence';
import { ITEM_SELECTOR, type RootContextValue, useActiveIndex, useRootContext } from './shared';

export type InputState = {
	open: boolean;
};

export type InputProps = Omit<useRender.ComponentProps<'input', InputState>, 'onKeyDown'> & {
	/** runs before the built-in key handling; call `preventBaseUIHandler()` to skip it. */
	onKeyDown?: (event: BaseUIEvent<KeyboardEvent<HTMLInputElement>>) => void;
};

const isPlainKey = (event: KeyboardEvent): boolean => {
	return !event.ctrlKey && !event.metaKey && !event.altKey;
};

const getRowStep = (ctx: RootContextValue, element: Element, step: 1 | -1): number => {
	const list = ctx.listRef.current;
	const row = element.closest('[role="row"]');
	if (!list || !row) {
		return -1;
	}
	const rows = Array.from(list.querySelectorAll('[role="row"]'));
	const target = rows[rows.indexOf(row) + step];
	if (!target) {
		return -1;
	}
	const column = Array.from(row.querySelectorAll(ITEM_SELECTOR)).indexOf(element);
	const cells = target.querySelectorAll<HTMLElement>(ITEM_SELECTOR);
	const cell = cells[Math.min(column, cells.length - 1)];
	return cell ? ctx.getItemIndex(cell) : -1;
};

const getGridStep = (ctx: RootContextValue, activeIndex: number, step: 1 | -1): number => {
	const element = document.getElementById(ctx.getItemId(activeIndex));
	if (element) {
		return getRowStep(ctx, element, step);
	}
	// resume at the visible edge if virtualization unmounted the highlighted cell.
	const rendered = ctx.listRef.current?.querySelectorAll(ITEM_SELECTOR);
	const edge = step === 1 ? rendered?.item(0) : rendered?.item(rendered.length - 1);
	return edge ? ctx.getItemIndex(edge) : -1;
};

const getNextIndex = (ctx: RootContextValue, key: string): number | null => {
	const { grid, items } = ctx;
	const activeIndex = ctx.highlight.get();
	const last = items.length - 1;
	if (last === -1) {
		return null;
	}

	switch (key) {
		case 'ArrowDown': {
			if (activeIndex === -1) {
				return 0;
			}
			if (grid) {
				return getGridStep(ctx, activeIndex, 1);
			}
			return activeIndex === last ? 0 : activeIndex + 1;
		}
		case 'ArrowUp': {
			if (activeIndex === -1) {
				return last;
			}
			if (grid) {
				return getGridStep(ctx, activeIndex, -1);
			}
			return activeIndex === 0 ? last : activeIndex - 1;
		}
		case 'ArrowLeft':
		case 'ArrowRight': {
			// without a highlight, horizontal arrows move the caret.
			if (!grid || activeIndex === -1) {
				return null;
			}
			const rtl = getComputedStyle(ctx.listRef.current ?? document.documentElement).direction === 'rtl';
			const step = (key === 'ArrowRight') !== rtl ? 1 : -1;
			return Math.min(Math.max(activeIndex + step, 0), last);
		}
	}
	return null;
};

/**
 * navigates and activates items while retaining focus. Escape or focus leaving the popup requests a close. a
 * `<textarea>` has combobox semantics only while the list is shown.
 *
 * @param props element props
 * @returns the input element; an `<input>` by default
 */
export const Input = ({ render, ref, ...elementProps }: InputProps) => {
	const ctx = useRootContext();
	const { expanded } = ctx;
	const activeIndex = useActiveIndex();
	const [isInput, setIsInput] = useState(true);
	const detectInput = useCallback((el: HTMLElement | null) => {
		if (el) {
			setIsInput(el instanceof HTMLInputElement);
		}
	}, []);

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		const native = event.nativeEvent;
		if (native.isComposing || native.keyCode === 229) {
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
			case 'ArrowLeft':
			case 'ArrowRight': {
				if (!isPlainKey(event)) {
					return;
				}
				if (!expanded) {
					if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
						event.preventDefault();
						ctx.requestOpenChange(true, { reason: 'list-navigation', event: native });
					}
					return;
				}
				const next = getNextIndex(ctx, event.key);
				if (next === null) {
					return;
				}
				event.preventDefault();
				if (next !== -1) {
					ctx.setActiveIndex(next, 'keyboard');
				}
				return;
			}
			case 'Enter': {
				const index = ctx.highlight.get();
				if (!expanded || index === -1 || !isPlainKey(event)) {
					return;
				}
				event.preventDefault();
				const element = document.getElementById(ctx.getItemId(index));
				if (element) {
					// run caller-provided item click handlers too.
					element.dispatchEvent(
						new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: event.shiftKey }),
					);
				} else {
					ctx.press(ctx.items[index], { event: native });
				}
				return;
			}
			case 'Escape': {
				if (ctx.inline || !expanded) {
					return;
				}
				// prevent Escape from also closing an enclosing dialog.
				event.preventDefault();
				ctx.requestOpenChange(false, { reason: 'escape-key', event: native });
				return;
			}
		}
	};

	const comboboxProps: InputHTMLAttributes<HTMLInputElement> =
		isInput || expanded
			? {
					role: 'combobox',
					'aria-autocomplete': 'list',
					'aria-expanded': expanded,
					'aria-haspopup': ctx.grid ? 'grid' : 'listbox',
					'aria-controls': expanded ? ctx.listId : undefined,
					'aria-activedescendant': activeIndex === -1 ? undefined : ctx.getItemId(activeIndex),
				}
			: {};

	const internalProps: InputHTMLAttributes<HTMLInputElement> = {
		id: ctx.inputId,
		value: ctx.inputValue,
		...comboboxProps,
		...(isInput && {
			autoComplete: 'off',
			autoCapitalize: 'none',
			autoCorrect: 'off',
			spellCheck: false,
		}),
		onChange(event) {
			ctx.setInputValue(event.currentTarget.value, { reason: 'input-change', event: event.nativeEvent });
		},
		onFocus: ctx.onInputFocus,
		onBlur: ctx.onInputBlur,
		onKeyDown,
	};

	return useRender({
		render,
		defaultTagName: 'input',
		ref: [ref ?? null, ctx.inputRef, detectInput],
		state: { open: expanded },
		stateAttributesMapping: triggerStateAttributes,
		props: mergeProps<'input'>(internalProps, elementProps),
	});
};
