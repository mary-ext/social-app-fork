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

/**
 * z-index scale. Two stacking spaces that don't directly compete — in-flow chrome (rendered in the document)
 * and portaled overlays (rendered late in `<body>`, already above the document) — but they're banded apart so
 * the global order is explicit and in-flow content (which should stay at `base`) can't accidentally outrank
 * chrome or an overlay. Component-local stacking (e.g. the composer's textarea over its preview, overlapping
 * avatars) is not part of this scale.
 */
export const zIndex = {
	base: 0,
	// in-flow chrome over page content
	sticky: 10, // sticky header, bottom bar
	stickyRaised: 20, // action slot within the sticky header
	// portaled overlays, each tier provably above the previous
	dialog: 100, // dialog backdrop / viewport / close, prompt
	menu: 110, // menus & autocomplete, and a dialog's outer close — over a dialog
	tooltip: 120, // tooltip & hover card — over dialogs and menus
} as const;

/** Runtime font-size multiplier; the ALF `ThemeProvider` writes it onto `<html>`, falling back to `1`. */
export const fontScale = createVar();

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
