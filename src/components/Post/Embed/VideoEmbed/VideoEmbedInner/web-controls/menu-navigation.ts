import { type RefObject, useEffect } from 'react';

import { type InputModality, type InteractionType, useInputModality } from '#/lib/browser/input-modality';
import { useConstant } from '#/lib/hooks/use-constant';

import { getListItems, getListNavigationProps, listItemProps } from '#/components/primitives/list-navigation';

const ACTIVE_MENU_ROW = 'data-menu-row-active';
const ACTIVE_MENU_ROW_SELECTOR = `[${ACTIVE_MENU_ROW}]`;

type PanelEntry = 'panel' | 'popup' | 'row';

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

	return panel.querySelector<HTMLElement>(ACTIVE_MENU_ROW_SELECTOR) ?? getListItems(panel)[0] ?? null;
};

/**
 * @param active whether navigation enters on this row
 * @returns navigation and active-row attributes
 */
export const menuRowProps = (active: boolean) => ({
	...listItemProps(),
	[ACTIVE_MENU_ROW]: active ? '' : undefined,
});

/**
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
 * sets entry focus and enables wrapping list navigation.
 *
 * @param ref panel element
 * @param options initial panel navigation state
 * @returns panel props
 */
export function useMenuNavigation(ref: RefObject<HTMLElement | null>, { navigated }: { navigated: boolean }) {
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
				findEntryRow(ref.current)?.focus();
				break;
			}
		}
	}, [panelEntry, ref]);

	return getListNavigationProps({ loop: true });
}
