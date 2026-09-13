import type { VideoAssetKind } from '#/lib/media/video/types';

/**
 * checks for the browser APIs needed to transcode the source.
 *
 * @param kind source attachment kind
 * @returns whether the APIs exist; does not check codec support
 */
export function canTranscode(kind: VideoAssetKind): boolean {
	if (kind === 'gif') {
		return typeof ImageDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined';
	}
	return typeof VideoDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined';
}

/**
 * checks whether an oversized source is eligible for transcoding.
 *
 * @param kind source attachment kind
 * @returns whether a non-GIF source can be transcoded
 */
export function canRescueOversized(kind: VideoAssetKind): boolean {
	// GIF decoding loads the entire source into memory, so retain its input size limit.
	return kind !== 'gif' && canTranscode(kind);
}

/**
 * checks for the browser APIs needed to render a voice clip.
 *
 * @returns whether the APIs exist; does not check codec support
 */
export function canRenderVoiceClip(): boolean {
	return (
		typeof OffscreenCanvas !== 'undefined' &&
		typeof AudioDecoder !== 'undefined' &&
		typeof AudioEncoder !== 'undefined' &&
		typeof VideoEncoder !== 'undefined'
	);
}
