import { Wordgard } from 'wordgard/editor';
import type { GardState } from 'wordgard/state';

/**
 * restores the saved selection on focus unless a pointer is placing the caret.
 *
 * @returns the focus-handling extension
 */
export const restoreSelectionOnFocus = (): GardState.Extension => {
	let pressing = false;

	return [
		Wordgard.domEventObserver('pointerdown', () => {
			pressing = true;
		}),
		Wordgard.domEventObserver('pointerup', () => {
			pressing = false;
		}),
		Wordgard.domEventObserver('pointercancel', () => {
			pressing = false;
		}),
		// pointerup may occur outside the editor.
		Wordgard.domEventObserver('blur', () => {
			pressing = false;
		}),
		Wordgard.domEventObserver('focus', (_event, wg) => {
			if (!pressing) {
				// queue the saved selection to prevent focus's flush from importing a stale DOM selection
				// left by another text field or a post redraw.
				wg.dispatch({ selection: wg.state.selection });
				wg.focus();
			}
		}),
	];
};
