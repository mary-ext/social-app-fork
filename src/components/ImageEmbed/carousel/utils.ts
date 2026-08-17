import {
	CAROUSEL_PEEK,
	ITEM_GAP,
	MAX_ASPECT_RATIO,
	MIN_ASPECT_RATIO,
} from '#/components/ImageEmbed/carousel/const';

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
 * derive the carousel's shared row height based on the orientation of the first two tiles and capped by the
 * maximum width budget.
 *
 * @param max maximum row height in px for portrait tiles
 * @param maxWidth width budget for the widest tile in px to prevent cropping
 * @param min minimum row height in px for landscape tiles
 * @param ratios aspect ratio of each tile
 * @returns the calculated row height in px
 */
export function deriveCarouselHeight({
	max,
	maxWidth = Infinity,
	min,
	ratios,
}: {
	max: number;
	maxWidth?: number;
	min: number;
	ratios: (number | undefined)[];
}): number {
	const avg = (clampAspectRatio(ratios[0]) + clampAspectRatio(ratios[1])) / 2;
	const t = (avg - MIN_ASPECT_RATIO) / (MAX_ASPECT_RATIO - MIN_ASPECT_RATIO);
	const base = max + t * (min - max);
	// reduce the height when the widest tile would hide the next-image peek
	const widest = Math.max(...ratios.map((ratio) => clampAspectRatio(ratio)));
	return Math.round(Math.min(base, maxWidth / widest));
}

/**
 * resolve a carousel item's rendered size from the row height and the image's aspect ratio.
 *
 * @param aspectRatio image width / height, if known
 * @param height carousel row height in px
 * @returns the item width, height, and whether the image is cover-cropped to fit
 */
export function computeDims({ aspectRatio, height }: { aspectRatio?: number; height: number }) {
	const clamped = clampAspectRatio(aspectRatio);
	const width = Math.floor(height * clamped);
	return { height, isCropped: (aspectRatio ?? 1) !== clamped, width };
}

/**
 * sizes a snapping carousel for its bleed host.
 *
 * @param bleedWidth width of the bleed host in px
 * @param insetLeft left gutter in px
 * @param insetRight right gutter in px
 * @param max maximum row height in px
 * @param min minimum row height in px
 * @param ratios tile aspect ratios in strip order
 * @returns shared row height and right padding
 */
export function getCarouselMetrics({
	bleedWidth,
	insetLeft,
	insetRight,
	max,
	min,
	ratios,
}: {
	bleedWidth: number;
	insetLeft: number;
	insetRight: number;
	max: number;
	min: number;
	ratios: (number | undefined)[];
}) {
	// reserve the gap and next-image peek after the widest tile
	const snapRoom = bleedWidth - insetLeft;
	const contentHeight = deriveCarouselHeight({
		max,
		maxWidth: Math.max(0, snapRoom - ITEM_GAP - CAROUSEL_PEEK),
		min,
		ratios,
	});

	// let the last tile snap without reducing the trailing gutter
	const lastItemWidth = computeDims({ aspectRatio: ratios.at(-1), height: contentHeight }).width;

	return { contentHeight, paddingRight: Math.max(insetRight, snapRoom - lastItemWidth) };
}
