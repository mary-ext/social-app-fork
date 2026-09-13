import { VIDEO_MAX_DURATION_MS, VIDEO_MAX_SIZE } from '#/lib/constants/video';
import { VideoTooLargeError } from '#/lib/media/video/errors';
import { canRescueOversized } from '#/lib/media/video/transcode/capabilities';

import type { VideoAssetKind, VideoPayload } from './types';

/**
 * checks attachment size, allowing oversized videos when transcoding is available.
 *
 * validate the final payload with {@link assertVideoWithinLimit} before uploading.
 *
 * @param kind source attachment kind
 * @param size the source's size in bytes
 * @returns whether the source may be attached
 */
export function isVideoSizeAdmissible(kind: VideoAssetKind, size: number): boolean {
	return size <= VIDEO_MAX_SIZE || canRescueOversized(kind);
}

/**
 * checks source duration against the video service's limit.
 *
 * @param duration duration in milliseconds
 * @returns whether the source may be attached
 */
export function isVideoDurationAdmissible(duration: number): boolean {
	return duration <= VIDEO_MAX_DURATION_MS;
}

/**
 * checks the payload against the video service's size limit.
 *
 * @param payload video to upload
 * @throws {VideoTooLargeError} if the video exceeds the upload size limit
 */
export function assertVideoWithinLimit(payload: VideoPayload): void {
	if (payload.blob.size > VIDEO_MAX_SIZE) {
		throw new VideoTooLargeError();
	}
}
