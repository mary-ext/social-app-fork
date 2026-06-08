// intentionally duplicated from `#/alf/base/tokens` rather than imported — see the note in
// `#/styles/palette`. the vanilla-extract layer owns its own design scales.
//
// most scales are plain values, read inside `*.css.ts` at build time. `fontSize` is the exception: it
// must scale at runtime by the `fontScale` variable (the ALF `ThemeProvider` writes it onto `<html>` from
// the user's font-size preference, defaulting to `1`), so it's projected to CSS variables assigned once on
// `:root` — every consumer references `fontSize.sm` etc. rather than re-deriving the `calc()`.

import { createGlobalTheme, createVar, fallbackVar } from '@vanilla-extract/css';

export const space = {
	_2xs: 2,
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	_2xl: 24,
	_3xl: 28,
	_4xl: 32,
	_5xl: 40,
} as const;

export const lineHeight = {
	none: 1,
	tight: 1.15,
	snug: 1.3,
	relaxed: 1.5,
} as const;

export const borderRadius = {
	_2xs: 2,
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	full: 999,
} as const;

export const fontWeight = {
	normal: '400',
	medium: '500',
	semiBold: '600',
	bold: '700',
} as const;

export const fontFamily = `InterVariable, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;

/** Runtime font-size multiplier; the ALF `ThemeProvider` writes it onto `<html>`, falling back to `1`. */
export const fontScale = createVar();

/**
 * Runtime `window.devicePixelRatio`; the ALF `ThemeProvider` writes it onto `<html>`, falling back to `1`.
 * Used to snap computed lengths (e.g. line-height) to the device-pixel grid, matching RNW's
 * `PixelRatio.roundToNearestPixel` and avoiding fractional CSS pixels, whose edges land between device
 * pixels and snap inconsistently (dropped hairlines, shifted alignment).
 */
export const dprScale = createVar();

const scaled = (px: number) => `calc(${px}px * ${fallbackVar(fontScale, '1')})`;

/**
 * Font-size scale as CSS variables, assigned once on `:root`, each scaling by {@link fontScale}. Consume
 * `fontSize.sm` etc. from `style()`/`styleVariants` and recipe variants.
 */
export const fontSize = createGlobalTheme(':root', {
	_2xs: scaled(9.4),
	xs: scaled(11.3),
	sm: scaled(13.1),
	md: scaled(15),
	lg: scaled(16.9),
	xl: scaled(18.8),
	_2xl: scaled(20.6),
	_3xl: scaled(24.3),
	_4xl: scaled(30),
	_5xl: scaled(37.5),
});
