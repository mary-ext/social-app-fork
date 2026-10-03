import { isGraphemeLengthInRange } from '@atcute/util-text';

import type { GardState } from 'wordgard/state';

import {
	MAX_DRAFT_CAPTION_SIZE,
	MAX_DRAFT_GRAPHEME_LENGTH,
	MAX_DRAFT_IMAGES,
} from '#/lib/constants/composer';

import { getMediaCaptions } from '../media/videos/captions';
import { getPostParam, getPosts, getPostText, type PostMedia } from '../model/schema';

/** why a thread can't be saved as a draft. */
export type DraftSaveBlocker = 'captionTooLarge' | 'tooLong' | 'tooManyMedia' | 'voiceClip';

// the draft format allows a gallery, a video or local GIF, and an external GIF together.
const fitsDraftPost = (media: readonly PostMedia[]): boolean => {
	const count = (kinds: readonly PostMedia['kind'][]) => {
		return media.filter((item) => kinds.includes(item.kind)).length;
	};

	return count(['image']) <= MAX_DRAFT_IMAGES && count(['gif', 'video']) <= 1 && count(['externalGif']) <= 1;
};

/**
 * checks whether the thread can be saved as a draft.
 *
 * @param state the composer's editor state
 * @returns why the thread can't be saved, or undefined if it can
 */
export const getDraftSaveBlocker = (state: GardState): DraftSaveBlocker | undefined => {
	const posts = getPosts(state.doc);
	const media = posts.flatMap(({ node }) => getPostParam(node).media);

	// the draft format has no voice clip representation.
	if (media.some((item) => item.kind === 'voice')) {
		return 'voiceClip';
	}
	if (!posts.every(({ node }) => isGraphemeLengthInRange(getPostText(node), 0, MAX_DRAFT_GRAPHEME_LENGTH))) {
		return 'tooLong';
	}
	if (!posts.every(({ node }) => fitsDraftPost(getPostParam(node).media))) {
		return 'tooManyMedia';
	}
	// use bytes as a conservative character limit to avoid reading caption files asynchronously.
	if (
		media.some((item) => {
			return getMediaCaptions(state, item.id).some((track) => track.file.size > MAX_DRAFT_CAPTION_SIZE);
		})
	) {
		return 'captionTooLarge';
	}
	return undefined;
};
