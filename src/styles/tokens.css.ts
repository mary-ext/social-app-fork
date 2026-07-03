// intentionally duplicated from `#/alf/base/tokens` rather than imported — see the note in
// `#/styles/palette`. the vanilla-extract layer owns its own design scales.
//
// most scales are plain values, read inside `*.css.ts` at build time. `fontSize` is the exception: each
// size is a `rem` so the scale tracks the browser/OS root font-size (`1rem` = root, default 16px), and it
// scales again at runtime by the `fontScale` variable (the ALF `ThemeProvider` writes it onto `<html>` from
// the user's font-size preference, defaulting to `1`). it's projected to CSS variables assigned once on
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

// scalar leading ratios for line-heights that aren't paired to a `fontSize` token: `none`/`tight` for the
// `Text` recipe's `none` leading and its callers' tight heading overrides, `snug` for a few controls that
// hardcode a 1.3 line-height (e.g. buttons). per-size paired ratios live in `fontLeading` below.
export const lineHeight = {
	none: 1,
	snug: 1.3,
	tight: 1.15,
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

// the platform UI sans-serif fallback chain, shared by both font-family options.
export const systemFontFamily = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;
// the "theme" option prepends the bundled Inter Variable webfont to the fallback chain.
export const themeFontFamily = `"Inter Variable", ${systemFontFamily}`;

/** Runtime UI font stack; the ALF `ThemeProvider` writes it onto `<html>` from the font-family preference. */
export const fontFamilyVar = createVar();

/**
 * Active UI font family: the `fontFamilyVar` preference, defaulting to the Inter Variable theme stack. Set
 * once on `<body>` so text elements inherit it rather than each re-declaring the stack.
 */
export const fontFamily = fallbackVar(fontFamilyVar, themeFontFamily);

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
	toast: 130, // transient notifications — above every other overlay so they're never obscured
} as const;

/** Runtime font-size multiplier; the ALF `ThemeProvider` writes it onto `<html>`, falling back to `1`. */
export const fontScale = createVar();

// the type scale, in `rem` (px at the default 16px root = rem × 16). each size carries its Tailwind-paired
// line-height (also rem); `md`/`md_sub` share a 20px line, `lg`/`lg_sub` a 24px line, etc. `md` (14px) is
// the default `Text` size; `md_sub` (13px) and `lg_sub` (15px) are half-steps that de-emphasize without
// dropping a full step, borrowing their larger sibling's line-height to hold the vertical rhythm.
const type = {
	_2xs: { fontSize: 0.625, lineHeight: 1 }, // 10 / 16
	xs: { fontSize: 0.6875, lineHeight: 1 }, // 11 / 16
	sm: { fontSize: 0.75, lineHeight: 1 }, // 12 / 16
	md_sub: { fontSize: 0.8125, lineHeight: 1.25 }, // 13 / 20
	md: { fontSize: 0.875, lineHeight: 1.25 }, // 14 / 20
	lg_sub: { fontSize: 0.9375, lineHeight: 1.5 }, // 15 / 24
	lg: { fontSize: 1, lineHeight: 1.5 }, // 16 / 24
	xl: { fontSize: 1.125, lineHeight: 1.75 }, // 18 / 28
	_2xl: { fontSize: 1.25, lineHeight: 1.75 }, // 20 / 28
	_3xl: { fontSize: 1.5, lineHeight: 2 }, // 24 / 32
	_4xl: { fontSize: 1.875, lineHeight: 2.25 }, // 30 / 36
	_5xl: { fontSize: 2.375, lineHeight: 2.5 }, // 38 / 40
} as const;

const scaled = (rem: number) => `calc(${rem}rem * ${fallbackVar(fontScale, '1')})`;

/**
 * Font-size scale as CSS variables, assigned once on `:root`, each scaling by {@link fontScale}. Consume
 * `fontSize.sm` etc. from `style()`/`styleVariants` and recipe variants.
 */
export const fontSize = createGlobalTheme(
	':root',
	Object.fromEntries(Object.entries(type).map(([key, { fontSize }]) => [key, scaled(fontSize)])) as {
		[K in keyof typeof type]: string;
	},
);

/**
 * Per-size default leading ratio (line-height ÷ font-size) — the Tailwind pairing for each size. The `Text`
 * recipe's `size` variant publishes it so `base` derives `round(font-size × ratio)`, and a consumer that
 * pairs its own line-height to a fixed size (e.g. a settings-card title) reads it directly.
 */
export const fontLeading = Object.fromEntries(
	Object.entries(type).map(([key, { fontSize, lineHeight }]) => [key, lineHeight / fontSize]),
) as { [K in keyof typeof type]: number };
