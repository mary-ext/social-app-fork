// intentionally duplicated from `#/alf/base/tokens` rather than imported — see the note in
// `#/styles/palette`. the vanilla-extract layer owns its own design scales.
//
// most scales are plain values, read inside `*.css.ts` at build time. `fontSize` is the exception: it
// must scale at runtime by the `--font-scale` custom property (set on `<html>` from the user's font-size
// preference, default `1`), so it's projected to CSS variables assigned once on `:root` — every consumer
// references `fontSize.sm` etc. rather than re-deriving the `calc()`.

import { createGlobalTheme } from '@vanilla-extract/css';

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

// raw px scale, kept private — consumers read the `--font-scale`-scaled `fontSize` vars below.
const fontSizeScale = {
	_2xs: 9.4,
	xs: 11.3,
	sm: 13.1,
	md: 15,
	lg: 16.9,
	xl: 18.8,
	_2xl: 20.6,
	_3xl: 24.3,
	_4xl: 30,
	_5xl: 37.5,
} as const;

/**
 * Font-size scale as CSS variables, assigned once on `:root`, each scaling by `--font-scale` (default 1).
 * Consume `fontSize.sm` etc. from both `style()`/`styleVariants` and the sprinkles `fontSize` property.
 */
export const fontSize = createGlobalTheme(
	':root',
	Object.fromEntries(
		Object.entries(fontSizeScale).map(([key, px]) => [key, `calc(${px}px * var(--font-scale, 1))`]),
	) as Record<keyof typeof fontSizeScale, string>,
);
