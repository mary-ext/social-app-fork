import type { MouseEvent } from 'react';

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
