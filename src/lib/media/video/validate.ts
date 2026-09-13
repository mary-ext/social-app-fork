import { VIDEO_MAX_DURATION_MS, VIDEO_MAX_SIZE } from '#/lib/constants/video';
import { VideoTooLargeError } from '#/lib/media/video/errors';
import { canRescueOversized } from '#/lib/media/video/transcode/transcode';

import type { VideoAsset, VideoAssetKind } from './types';

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
