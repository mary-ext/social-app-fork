import { MAX_ASPECT_RATIO, MIN_ASPECT_RATIO } from '#/components/ImageEmbed/carousel/const';

export function getAspectRatio({ width, height }: { width?: number; height?: number } = {}) {
	if (width && width > 0 && height && height > 0) {
		return width / height;
	}
	return undefined;
}

/**
 * clamp an aspect ratio to the range of {@link MIN_ASPECT_RATIO} to {@link MAX_ASPECT_RATIO}. defaults to 1
 * (square) if undefined.
 *
 * @param aspectRatio image width / height
 * @returns clamped ratio
 */
export function clampAspectRatio(aspectRatio?: number): number {
	return Math.max(MIN_ASPECT_RATIO, Math.min(aspectRatio ?? 1, MAX_ASPECT_RATIO));
}

/**
 * checks whether an image is cropped to fit its carousel tile.
 *
 * @param aspectRatio image width / height, if known
 * @returns true if the image exceeds the tile's aspect-ratio limits; false for unknown ratios
 */
export function isTileCropped(aspectRatio?: number): boolean {
	return (aspectRatio ?? 1) !== clampAspectRatio(aspectRatio);
}
