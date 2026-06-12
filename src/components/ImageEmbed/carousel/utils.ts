import { ITEM_GAP, MAX_ASPECT_RATIO, MIN_ASPECT_RATIO } from '#/components/ImageEmbed/carousel/const';

export function getOffsetForIndex(itemWidths: Map<number, number>, index: number): number {
	let offset = 0;
	for (let i = 0; i < index; i++) {
		offset += (itemWidths.get(i) ?? 0) + ITEM_GAP;
	}
	return offset;
}

export function getAspectRatio({ width, height }: { width?: number; height?: number } = {}) {
	if (width && width > 0 && height && height > 0) {
		return width / height;
	}
	return undefined;
}

/**
 * Resolve a carousel item's rendered size from the content height and the image's aspect ratio.
 *
 * Old images, or images from other clients, can lack an aspect ratio; default to square and resize once the
 * image loads. The ratio is clamped between {@link MIN_ASPECT_RATIO} (portrait) and {@link MAX_ASPECT_RATIO}
 * (landscape) so items stay a reasonable size in the carousel.
 *
 * @param height carousel content height in px
 * @param aspectRatio image width / height, if known
 * @returns the item width/height, the clamped ratio, and whether the image was cropped to fit
 */
export function computeDims({ height, aspectRatio }: { height: number; aspectRatio?: number }) {
	const raw = aspectRatio ?? 1;
	const clamped = Math.max(MIN_ASPECT_RATIO, Math.min(raw, MAX_ASPECT_RATIO));
	const width = Math.floor(height * clamped);
	return { width, height, aspectRatio: clamped, isCropped: raw !== clamped };
}
