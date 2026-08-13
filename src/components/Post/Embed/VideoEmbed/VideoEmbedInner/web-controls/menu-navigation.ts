import { type KeyboardEvent, type PointerEvent, type RefObject, useEffect, useRef, useState } from 'react';

import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';

import { type InputModality, useInputModality } from '#/lib/browser/input-modality';
import { useConstant } from '#/lib/hooks/use-constant';

const MENU_ROW = 'data-menu-row';
const ACTIVE_MENU_ROW = 'data-menu-row-active';
const MENU_ROW_SELECTOR = `[${MENU_ROW}]`;
const ACTIVE_MENU_ROW_SELECTOR = `[${ACTIVE_MENU_ROW}]`;

type PanelEntry = 'panel' | 'popup' | 'row';

const canHover = (modality: InputModality) => modality === 'mouse' || modality === 'pen';

const resolvePanelEntry = (navigated: boolean, modality: InputModality): PanelEntry => {
	if (!navigated) {
		return 'popup';
	}

	// touch cannot clear a focused row through pointer-out.
	if (modality === 'touch') {
		return 'panel';
	}

	return 'row';
};

const findEntryRow = (panel: HTMLElement | null) => {
	if (!panel) {
		return null;
	}

	return (
		panel.querySelector<HTMLElement>(ACTIVE_MENU_ROW_SELECTOR) ??
		panel.querySelector<HTMLElement>(MENU_ROW_SELECTOR)
	);
};

/**
 * creates menu-row attributes.
 *
 * @param active whether navigation enters on this row
 * @returns menu-row attributes
 */
export const menuRowProps = (active: boolean) => ({
	[MENU_ROW]: '',
	[ACTIVE_MENU_ROW]: active ? '' : undefined,
});

/**
 * gets the initial focus target for an opening menu.
 *
 * @param panel panel element
 * @param openType how the popup was opened
 * @returns the entry row for keyboard opens, otherwise the panel
 */
export const menuInitialFocus = (panel: HTMLElement | null, openType: InteractionType) => {
	if (openType !== 'keyboard') {
		return panel;
	}

	return findEntryRow(panel) ?? panel;
};

/**
 * controls focus and highlighting in a menu panel.
 *
 * @param ref panel element
 * @param options initial panel navigation state
 * @returns composite and panel props
 */
export function useMenuNavigation(ref: RefObject<HTMLElement | null>, { navigated }: { navigated: boolean }) {
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [entryRowReady, setEntryRowReady] = useState(false);
	const rows = useRef<HTMLElement[]>([]);
	const modality = useInputModality();

	const panelEntry = useConstant(() => resolvePanelEntry(navigated, modality));

	useEffect(() => {
		switch (panelEntry) {
			case 'panel': {
				ref.current?.focus({ preventScroll: true });
				break;
			}
			case 'popup': {
				break;
			}
			case 'row': {
				if (entryRowReady) {
					findEntryRow(ref.current)?.focus();
				}
				break;
			}
		}
	}, [entryRowReady, panelEntry, ref]);

	const clearHighlight = () => {
		const container = ref.current;
		const active = document.activeElement;
		if (!container || !(active instanceof Element) || !container.contains(active)) {
			return;
		}
		if (!active.closest(MENU_ROW_SELECTOR)) {
			return;
		}

		container.focus({ preventScroll: true });
		setHighlightedIndex(-1);
	};

	const onMapChange = (map: Map<Node, unknown>) => {
		rows.current = Array.from(map.keys()).filter((row) => row instanceof HTMLElement);

		// wait until the composite assigns item indices.
		if (panelEntry === 'row' && rows.current.length > 0) {
			setEntryRowReady(true);
		}
	};

	const rootProps = {
		tabIndex: -1,
		onKeyDown: (event: KeyboardEvent) => {
			// the composite does not wrap from -1.
			if (event.key === 'ArrowUp' && highlightedIndex === -1) {
				const last = rows.current.at(-1);
				if (last) {
					event.preventDefault();
					last.focus();
				}
			}
		},
		onPointerOut: (event: PointerEvent) => {
			// ignore pointer movement caused by panel resizing.
			if (!canHover(modality)) {
				return;
			}
			const related = event.relatedTarget;
			if (related instanceof Element && related.closest(MENU_ROW_SELECTOR)) {
				return;
			}

			clearHighlight();
		},
	};

	return {
		compositeProps: {
			highlightItemOnHover: canHover(modality),
			highlightedIndex,
			onHighlightedIndexChange: setHighlightedIndex,
			onMapChange,
		},
		rootProps,
	};
}
