import {
	CAROUSEL_HEIGHT_BOTH_SQUARE,
	CAROUSEL_HEIGHT_BOTH_WIDE,
	CAROUSEL_HEIGHT_DEFAULT,
	CAROUSEL_HEIGHT_MIXED,
	ITEM_GAP,
	MAX_ASPECT_RATIO,
	MIN_ASPECT_RATIO,
} from '#/components/ImageEmbed/carousel/const';

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
 * Clamp an aspect ratio into the carousel's allowed range, {@link MIN_ASPECT_RATIO} (portrait) to
 * {@link MAX_ASPECT_RATIO} (landscape), so tiles stay a reasonable size. A missing ratio defaults to square.
 *
 * @param aspectRatio image width / height, if known
 * @returns the clamped ratio
 */
export function clampAspectRatio(aspectRatio?: number): number {
	return Math.max(MIN_ASPECT_RATIO, Math.min(aspectRatio ?? 1, MAX_ASPECT_RATIO));
}

/**
 * Pick the carousel's shared row height from the orientation of its first two items, mirroring Threads: a
 * wide/wide pair packs short, a portrait/landscape mix sits between, a square/square pair a touch taller, and
 * anything else (a tall pair, or ratios between the clamp limits) gets the most room. Only the first two
 * items matter; the rest scroll at the chosen height.
 *
 * @param first aspect ratio (width / height) of the first item, if known
 * @param second aspect ratio of the second item, if known
 * @returns the row height in px
 */
export function deriveCarouselHeight(first?: number, second?: number): number {
	const a = clampAspectRatio(first);
	const b = clampAspectRatio(second);
	const isWide = (ratio: number) => ratio === MAX_ASPECT_RATIO;
	const isTall = (ratio: number) => ratio === MIN_ASPECT_RATIO;
	if (isWide(a) && isWide(b)) {
		return CAROUSEL_HEIGHT_BOTH_WIDE;
	}
	if ((isTall(a) && isWide(b)) || (isWide(a) && isTall(b))) {
		return CAROUSEL_HEIGHT_MIXED;
	}
	if (a === 1 && b === 1) {
		return CAROUSEL_HEIGHT_BOTH_SQUARE;
	}
	return CAROUSEL_HEIGHT_DEFAULT;
}

/**
 * Resolve a carousel item's rendered size from the row height and the image's aspect ratio.
 *
 * Old images, or images from other clients, can lack an aspect ratio; default to square and resize once the
 * image loads. The ratio is clamped (see {@link clampAspectRatio}) so items stay a reasonable size.
 *
 * @param height carousel row height in px
 * @param aspectRatio image width / height, if known
 * @returns the item width/height and whether the image was cropped to fit
 */
export function computeDims({ height, aspectRatio }: { height: number; aspectRatio?: number }) {
	const clamped = clampAspectRatio(aspectRatio);
	const width = Math.floor(height * clamped);
	return { width, height, isCropped: (aspectRatio ?? 1) !== clamped };
}
