import { VIDEO_MAX_SIZE } from '#/lib/constants';
import { VideoTooLargeError } from '#/lib/media/video/errors';

import type { CompressedVideo, VideoAsset } from './types';

/**
 * web does not compress videos client-side; this only validates the size and hands the blob through.
 *
 * @param asset the selected video
 * @returns the video blob, unchanged
 * @throws {VideoTooLargeError} if the video exceeds the upload size limit
 */
export function assertVideoWithinLimit(asset: VideoAsset): CompressedVideo {
	if (asset.blob.size > VIDEO_MAX_SIZE) {
		throw new VideoTooLargeError();
	}

	return {
		blob: asset.blob,
		mimeType: asset.mimeType,
	};
}
