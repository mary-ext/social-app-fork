import type { Wordgard } from 'wordgard/editor';
import type { GardState } from 'wordgard/state';

import { defineTaint } from '../editor/taints';

/** alt text keyed by media id. */
export const altTaint = defineTaint<string>({
	isEmpty: (alt) => alt === '',
	isSame: (a, b) => a === b,
});

/**
 * reads an attachment's alt text.
 *
 * @param state the editor state
 * @param mediaId the media's id
 * @returns the alt text, or an empty string if unset
 */
export const getMediaAlt = (state: GardState, mediaId: string): string => {
	return state.field(altTaint.field).get(mediaId) ?? '';
};

/**
 * checks whether an attachment has alt text.
 *
 * @param state the editor state
 * @param mediaId the media's id
 * @returns whether alt text is set
 */
export const hasMediaAlt = (state: GardState, mediaId: string): boolean => {
	return state.field(altTaint.field).has(mediaId);
};

/**
 * replaces an attachment's alt text. not undoable.
 *
 * @param wg the editor
 * @param mediaId the media's id
 * @param alt replacement alt text; an empty string clears it
 */
export const setMediaAlt = (wg: Wordgard, mediaId: string, alt: string): void => {
	altTaint.set(wg, [mediaId], alt);
};
