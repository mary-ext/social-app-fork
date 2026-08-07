import { useEffect, useRef, useState } from 'react';

import { useInputModality } from '#/lib/browser/input-modality';

const MENU_ROW = 'data-menu-row';

const ACTIVE_MENU_ROW = 'data-menu-row-active';

const MENU_ROW_SELECTOR = `[${MENU_ROW}]`;

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
 * controls focus and highlighting in a menu panel.
 *
 * @param ref panel element
 * @param options panel navigation state
 * @returns composite state and props
 */
export function useMenuNavigation(
	ref: React.RefObject<HTMLElement | null>,
	{ navigated }: { navigated: boolean },
) {
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [rowsReady, setRowsReady] = useState(false);
	const rows = useRef<HTMLElement[]>([]);
	const modality = useInputModality();

	// wait for composite item indices before focusing a row.
	useEffect(() => {
		if (!rowsReady) {
			return;
		}

		const active = rows.current.find((row) => row.hasAttribute(ACTIVE_MENU_ROW));
		(active ?? rows.current[0])?.focus();
	}, [rowsReady]);

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
		if (navigated && rows.current.length > 0) {
			setRowsReady(true);
		}
	};

	const rootProps = {
		tabIndex: -1,
		onKeyDown: (event: React.KeyboardEvent) => {
			// the composite does not wrap from -1.
			if (event.key === 'ArrowUp' && highlightedIndex === -1) {
				const last = rows.current.at(-1);
				if (last) {
					event.preventDefault();
					last.focus();
				}
			}
		},
		onPointerOut: (event: React.PointerEvent) => {
			// ignore pointer movement caused by panel resizing.
			if (modality !== 'mouse' && modality !== 'pen') {
				return;
			}
			const related = event.relatedTarget;
			if (related instanceof Element && related.closest(MENU_ROW_SELECTOR)) {
				return;
			}

			clearHighlight();
		},
	};

	return { highlightedIndex, onHighlightedIndexChange: setHighlightedIndex, onMapChange, rootProps };
}
