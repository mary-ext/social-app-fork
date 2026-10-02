import { isGraphemeLengthInRange } from '@atcute/util-text';

import type { Plot } from 'wordgard/doc';

import { MAX_DRAFT_GRAPHEME_LENGTH } from '#/lib/constants/composer';

import { getPostParam, getPosts, getPostText } from '../model/schema';

/** why a thread can't be saved as a draft. */
export type DraftSaveBlocker = 'tooLong' | 'voiceClip';

/**
 * checks whether the thread can be saved as a draft.
 *
 * @param doc the thread document
 * @returns why the thread can't be saved, or undefined if it can
 */
export const getDraftSaveBlocker = (doc: Plot.Doc): DraftSaveBlocker | undefined => {
	const posts = getPosts(doc);

	// the draft format has no voice clip representation.
	if (posts.some(({ node }) => getPostParam(node).media.some((media) => media.kind === 'voice'))) {
		return 'voiceClip';
	}
	if (!posts.every(({ node }) => isGraphemeLengthInRange(getPostText(node), 0, MAX_DRAFT_GRAPHEME_LENGTH))) {
		return 'tooLong';
	}
	return undefined;
};
