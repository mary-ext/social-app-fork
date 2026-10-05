import type { GardState } from 'wordgard/state';

import { getMediaProblem, isVideoUploadMedia } from '../media/attachments';
import { isOverLimit, isSkippedPost } from '../model/post-info';
import { getPostParam, getPosts } from '../model/schema';

/** why a thread can't be published. */
export type PublishBlocker = 'empty' | 'invalidMedia' | 'tooLong' | 'uploadFailed';

/**
 * checks whether the thread can be published. unfinished uploads don't block; publishing waits for them.
 *
 * @param state the editor state
 * @param failedUploads files whose upload failed
 * @returns why the thread can't be published, or null if it can
 */
export const getPublishBlocker = (
	state: GardState,
	failedUploads: ReadonlySet<File>,
): PublishBlocker | null => {
	let isEmpty = true;
	for (const { node } of getPosts(state.doc)) {
		const { media } = getPostParam(node);

		if (isOverLimit(state, node)) {
			return 'tooLong';
		}
		if (getMediaProblem(media) !== null) {
			return 'invalidMedia';
		}
		if (
			failedUploads.size > 0 &&
			media.some((item) => isVideoUploadMedia(item) && failedUploads.has(item.file))
		) {
			return 'uploadFailed';
		}

		isEmpty &&= isSkippedPost(state, node);
	}

	return isEmpty ? 'empty' : null;
};
