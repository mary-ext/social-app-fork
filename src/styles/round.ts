import { fallbackVar } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { dprScale } from '#/styles/tokens.css';

/**
 * Wraps a CSS length so it snaps to the device-pixel grid via {@link dprScale} — `round(length, 1px / dpr)`.
 * Use for derived lengths (e.g. line-height) that would otherwise resolve to fractional CSS pixels, which
 * Chrome renders poorly; this matches RNW's `PixelRatio.roundToNearestPixel`.
 *
 * Lives in a plain module rather than a `*.css.ts` because vanilla-extract forbids function exports from
 * style files (it serializes their exports).
 *
 * @param length any CSS length expression
 * @returns the length wrapped in a `round()` to the nearest device pixel
 */
export const roundToDevicePx = (length: string) =>
	`round(${length}, ${calc.divide('1px', fallbackVar(dprScale, '1'))})`;
