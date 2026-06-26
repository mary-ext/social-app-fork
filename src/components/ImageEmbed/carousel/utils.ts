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
 * Derive the carousel's shared row height. Two forces shape it:
 *
 * - Orientation: the first two tiles' average clamped aspect ratio maps linearly across the aspect range onto
 *   `[min, max]` — a wide pair packs short, a portrait pair stands tall. Only those two matter.
 * - Fit: the result is then capped so the _widest_ tile's natural width stays within `maxWidth`, leaving the
 *   next tile to peek. On a narrow viewport this pulls the height below `min` rather than cropping the
 *   image.
 *
 * @param max row height in px for a fully portrait first pair
 * @param maxWidth width budget for the widest tile in px (the strip minus its gutter, gap and peek); omit for
 *   no fit cap
 * @param min row height in px for a fully landscape first pair
 * @param ratios every tile's aspect ratio (width / height) in order; missing entries default to square
 * @returns the row height in px
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
	// Orientation base: both ratios are clamped, so their average — and thus `t` — stays within [0, 1].
	const avg = (clampAspectRatio(ratios[0]) + clampAspectRatio(ratios[1])) / 2;
	const t = (avg - MIN_ASPECT_RATIO) / (MAX_ASPECT_RATIO - MIN_ASPECT_RATIO);
	const base = max + t * (min - max);
	// Fit: keep the widest tile (height * widest ratio) within the budget so it leaves a peek instead of
	// overflowing — uncropped, just shorter.
	const widest = Math.max(...ratios.map((ratio) => clampAspectRatio(ratio)));
	return Math.round(Math.min(base, maxWidth / widest));
}

/**
 * Resolve a carousel item's rendered size from the row height and the image's aspect ratio.
 *
 * Old images, or images from other clients, can lack an aspect ratio; those default to square. The ratio is
 * clamped (see {@link clampAspectRatio}) so items stay a reasonable size.
 *
 * `isCropped` flags a known ratio that falls outside the clamp — the tile is sized to the clamped ratio and
 * the image cover-cropped to fill it. A missing ratio is not cropped (it's contained instead, see Gallery).
 *
 * @param aspectRatio image width / height, if known
 * @param height carousel row height in px
 * @returns the item width/height and whether the image is cover-cropped to fit
 */
export function computeDims({ aspectRatio, height }: { aspectRatio?: number; height: number }) {
	const clamped = clampAspectRatio(aspectRatio);
	const width = Math.floor(height * clamped);
	return { height, isCropped: (aspectRatio ?? 1) !== clamped, width };
}
