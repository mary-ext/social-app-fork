import { VIDEO_MAX_SIZE } from '#/lib/constants/video';
import { VideoTooLargeError } from '#/lib/media/video/errors';

import type { VideoAsset } from './types';

/**
 * checks that a selected video is small enough for the video service to accept.
 *
 * @param asset the selected video
 * @throws {VideoTooLargeError} if the video exceeds the upload size limit
 */
export function assertVideoWithinLimit(asset: VideoAsset): void {
	if (asset.blob.size > VIDEO_MAX_SIZE) {
		throw new VideoTooLargeError();
	}
}
