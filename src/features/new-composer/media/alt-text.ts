import type { Wordgard } from 'wordgard/editor';

import type { PostMedia } from '../editor/schema';
import { defineTaint, emptyTaintMap, type TaintMap } from '../editor/taints';

/** non-empty alt text keyed by media id. */
export type AltTexts = TaintMap<string>;

/** alt text updates keyed by media id. */
export const altTaint = defineTaint<string>({
	isEmpty: (alt) => alt === '',
	isSame: (a, b) => a === b,
});

/**
 * selects alt text for a post's media.
 *
 * @param alts composer-wide alt text
 * @param media the post's media
 * @returns the post's alt text
 */
export const getAltTexts = (alts: AltTexts, media: readonly PostMedia[]): AltTexts => {
	if (media.length === 0 || alts.size === 0) {
		return emptyTaintMap;
	}

	const picked = new Map<string, string>();
	for (const item of media) {
		const alt = alts.get(item.id);
		if (alt !== undefined) {
			picked.set(item.id, alt);
		}
	}
	return picked;
};

/**
 * compares alt text maps by media id and text.
 *
 * @param a the first map
 * @param b the second map
 * @returns whether all entries match
 */
export const isSameAltTexts = (a: AltTexts, b: AltTexts): boolean => {
	if (a.size !== b.size) {
		return false;
	}
	for (const [id, alt] of a) {
		if (b.get(id) !== alt) {
			return false;
		}
	}
	return true;
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
