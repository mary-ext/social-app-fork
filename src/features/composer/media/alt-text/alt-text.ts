import type { Wordgard } from 'wordgard/editor';
import type { GardState } from 'wordgard/state';

import { getPostParam, getPosts, type PostMedia } from '../../model/schema';
import { defineTaint } from '../../model/taints';

/** alt text keyed by media ID. */
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
 * finds the thread's first attachment without alt text.
 *
 * @param state the editor state
 * @returns the attachment and its post ID, or undefined if none is missing alt text
 */
export const findMissingAlt = (state: GardState): { postId: string; item: PostMedia } | undefined => {
	for (const { node, id } of getPosts(state.doc)) {
		for (const item of getPostParam(node).media) {
			if (!hasMediaAlt(state, item.id)) {
				return { postId: id, item };
			}
		}
	}
};

/**
 * replaces an attachment's alt text.
 *
 * @param wg the editor
 * @param options.mediaId the media's id
 * @param options.alt replacement alt text; an empty string clears it
 */
export const setMediaAlt = (wg: Wordgard, { mediaId, alt }: { mediaId: string; alt: string }): void => {
	altTaint.set(wg, [mediaId], alt);
};
