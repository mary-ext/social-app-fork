import { type FocusEvent, type KeyboardEvent, type MouseEvent, useState } from 'react';

import type { Wordgard } from 'wordgard/editor';

// #region editor focus

/**
 * preserves editor focus for undo shortcuts when clicking controls.
 *
 * use on controls, not draggable tiles: preventing mouse down cancels dragging.
 *
 * @param event the control's mouse down event
 */
export const keepEditorFocus = (event: MouseEvent) => {
	event.preventDefault();
};

/**
 * focuses the editor on Escape and prevents dialog dismissal.
 *
 * @param wg the editor
 * @param event the controls' keydown event
 */
export const escapeToEditor = (wg: Wordgard, event: KeyboardEvent) => {
	if (event.key !== 'Escape') {
		return;
	}

	event.preventDefault();
	event.stopPropagation();
	wg.focus();
};

// #endregion

// #region roving focus

const ROVING_ITEM_ATTR = 'data-roving-item';

/** props to spread onto a roving focus item. */
export type RovingItemProps = {
	[ROVING_ITEM_ATTR]: string;
	tabIndex: number;
	onFocus: (event: FocusEvent) => void;
};

/** a horizontal focus group with one tab stop. */
export type RovingFocus<K extends string> = {
	/**
	 * @param key the item's key, unique within the group
	 * @returns props for the item's focusable element
	 */
	item: (key: K) => RovingItemProps;
	/** handles arrow, Home, and End keys; attach to the group's container. */
	onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

/**
 * remembers the last focused item as the group's tab stop, falling back to the first item.
 *
 * @param keys the items' keys, in order
 * @param enabled whether the group is tabbable
 * @returns item props and the group's key handler
 */
export const useRovingFocus = <K extends string>(keys: readonly K[], enabled: boolean): RovingFocus<K> => {
	const [current, setCurrent] = useState<K | null>(null);
	const stop = current !== null && keys.includes(current) ? current : keys[0];

	return {
		item: (key) => ({
			[ROVING_ITEM_ATTR]: key,
			tabIndex: enabled && key === stop ? 0 : -1,
			onFocus: (event) => {
				if (event.target === event.currentTarget) {
					setCurrent(key);
				}
			},
		}),
		onKeyDown: (event) => {
			// reserve modified arrows for item shortcuts.
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
				return;
			}

			const items = [...event.currentTarget.querySelectorAll<HTMLElement>(`[${ROVING_ITEM_ATTR}]`)];
			const index = items.findIndex((item) => item === event.target);
			if (index === -1) {
				return;
			}

			let next: HTMLElement | undefined;
			switch (event.key) {
				case 'ArrowLeft': {
					next = items[index - 1];
					break;
				}
				case 'ArrowRight': {
					next = items[index + 1];
					break;
				}
				case 'Home': {
					next = items[0];
					break;
				}
				case 'End': {
					next = items[items.length - 1];
					break;
				}
				default: {
					return;
				}
			}

			event.preventDefault();
			next?.focus();
		},
	};
};

// #endregion
