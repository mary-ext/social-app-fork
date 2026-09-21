import type { KeyboardEvent, MouseEvent } from 'react';

import type { Wordgard } from 'wordgard/editor';

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
