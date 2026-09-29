import type { CSSProperties } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { MAX_ASPECT_RATIO, MIN_ASPECT_RATIO } from '#/components/ImageEmbed/carousel/const';
import * as css from '#/components/ImageEmbed/carousel/strip.css';
import { clampAspectRatio } from '#/components/ImageEmbed/carousel/utils';

// use the first two clamped ratios to interpolate between portrait and landscape heights.
function deriveCarouselHeight({ max, min, ratios }: { max: number; min: number; ratios: number[] }): number {
	const avg = ((ratios[0] ?? 1) + (ratios[1] ?? 1)) / 2;
	const t = (avg - MIN_ASPECT_RATIO) / (MAX_ASPECT_RATIO - MIN_ASPECT_RATIO);
	return Math.round(max + t * (min - max));
}

/**
 * sizes a carousel strip. apply to the element with the strip's `root` class.
 *
 * @param options preferred height bounds in px and tile aspect ratios in strip order
 * @returns inline custom properties
 */
export function getStripStyle({
	max,
	min,
	ratios,
}: {
	max: number;
	min: number;
	ratios: (number | undefined)[];
}): CSSProperties {
	const clamped = ratios.map((ratio) => clampAspectRatio(ratio));

	return assignInlineVars({
		[css.baseHeightVar]: `${deriveCarouselHeight({ max, min, ratios: clamped })}px`,
		[css.lastRatioVar]: String(clamped.at(-1) ?? 1),
		[css.ratioSumVar]: String(clamped.reduce((sum, ratio) => sum + ratio, 0)),
		[css.tileCountVar]: String(ratios.length),
		[css.widestRatioVar]: String(Math.max(...clamped)),
	});
}

/**
 * sizes a carousel tile. apply to the element with the strip's `tile` class.
 *
 * @param aspectRatio image width / height, if known
 * @returns inline custom properties
 */
export function getTileStyle(aspectRatio?: number): CSSProperties {
	return assignInlineVars({ [css.tileRatioVar]: String(clampAspectRatio(aspectRatio)) });
}
