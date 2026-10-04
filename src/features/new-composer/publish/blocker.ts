import type { GardState } from 'wordgard/state';

import { getMediaProblem } from '../media/attachments';
import { isOverLimit, isSkippedPost } from '../model/post-info';
import { getPostParam, getPosts } from '../model/schema';

/** why a thread can't be published. */
export type PublishBlocker = 'empty' | 'invalidMedia' | 'tooLong' | 'unsupportedMedia';

/**
 * checks whether the thread can be published.
 *
 * @param state the editor state
 * @returns why the thread can't be published, or null if it can
 */
export const getPublishBlocker = (state: GardState): PublishBlocker | null => {
	let isEmpty = true;
	for (const { node } of getPosts(state.doc)) {
		const { media } = getPostParam(node);

		if (isOverLimit(state, node)) {
			return 'tooLong';
		}
		if (getMediaProblem(media) !== null) {
			return 'invalidMedia';
		}
		// voice clips have no embed type; videos and local GIFs await the video upload service.
		if (media.some((item) => item.kind === 'gif' || item.kind === 'video' || item.kind === 'voice')) {
			return 'unsupportedMedia';
		}

		isEmpty &&= isSkippedPost(state, node);
	}

	return isEmpty ? 'empty' : null;
};
