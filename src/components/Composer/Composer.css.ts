import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { roundToPx } from '#/styles/round';
import { fontFamily, fontLeading, fontSize } from '#/styles/tokens.css';

// one font size and its paired leading feed both layers via these vars, set by the `root` recipe's `fontSize`
// variant, so the transparent textarea and the colored preview overlay can never drift to different metrics.
const fontSizeVar = createVar();
const leadingVar = createVar();

// per-instance layout inputs, supplied by the component through `assignInlineVars` on `root` and consumed by
// the rules below — so every property declaration (padding, min/max-height, scroll-padding) lives here in CSS
// and only the bare values cross over from JS.
export const paddingTopVar = createVar();
export const paddingBottomVar = createVar();
export const paddingLeftVar = createVar();
export const paddingRightVar = createVar();
export const minRowsVar = createVar();
export const maxRowsVar = createVar();

const fontSizeValue = fallbackVar(fontSizeVar, fontSize.lg);
const leadingValue = fallbackVar(leadingVar, String(fontLeading.lg));

// pixel-snapped like `Text`, and shared by `rowsHeight` and `textMetrics` so row sizing tracks the line.
const lineHeightValue = roundToPx(`calc(${fontSizeValue} * ${leadingValue})`);

// the border-box height of `rows` text rows plus the vertical content padding.
const rowsHeight = (rows: string) =>
	`calc(${lineHeightValue} * ${rows} + ${paddingTopVar} + ${paddingBottomVar})`;

// shared metrics so the transparent textarea and the colored preview overlay wrap + advance identically;
// composed into both rather than spread into each.
const textMetrics = style({
	fontFamily,
	fontSize: fontSizeValue,
	letterSpacing: 'normal',
	lineHeight: lineHeightValue,
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
});

// the content padding both layers share; composed into each so their glyphs line up exactly.
const padding = style({
	paddingBottom: paddingBottomVar,
	paddingLeft: paddingLeftVar,
	paddingRight: paddingRightVar,
	paddingTop: paddingTopVar,
});

export const root = recipe(
	{
		base: {
			position: 'relative',
			zIndex: 0,
		},
		variants: {
			fontSize: {
				lg: { vars: { [fontSizeVar]: fontSize.lg, [leadingVar]: String(fontLeading.lg) } },
				md: { vars: { [fontSizeVar]: fontSize.md, [leadingVar]: String(fontLeading.md) } },
			},
		},
		defaultVariants: {
			fontSize: 'lg',
		},
	},
	{ debugId: 'root' },
);

// caps the editor at `maxRows` and scrolls past it. the scroll lives on `root` itself: because the preview
// overlay is sized to its own content (not pinned to the scrollport), it scrolls in lockstep with the
// textarea, so the two layers stay registered without any scroll syncing. scroll-padding matches the content
// padding so caret-following scrolls leave breathing room at the scroll extremes.
export const capped = style({
	maxHeight: rowsHeight(maxRowsVar),
	overflowY: 'auto',
	scrollPaddingBottom: paddingBottomVar,
	scrollPaddingTop: paddingTopVar,
	scrollbarColor: `${vars.palette.contrast_200} transparent`,
	scrollbarWidth: 'thin',
});

// the colored preview layer behind the transparent textarea: it owns the visible glyphs (the textarea's text
// is transparent). sized to its own content so its height tracks the textarea's and it scrolls together with
// it when the editor is capped.
export const overlay = style([
	textMetrics,
	padding,
	{
		color: vars.palette.contrast_1000,
		left: 0,
		pointerEvents: 'none',
		position: 'absolute',
		right: 0,
		top: 0,
		zIndex: 10,
	},
]);

export const facet = style({
	color: vars.palette.primary_500,
});

export const textarea = style([
	textMetrics,
	padding,
	{
		appearance: 'none',
		background: 'transparent',
		border: 0,
		// so the `minHeight` (content + padding) matches the rendered border-box height
		boxSizing: 'border-box',
		// the preview owns the visible glyphs; the textarea contributes only the caret + selection.
		caretColor: vars.palette.contrast_1000,
		color: 'transparent',
		display: 'block',
		// CSS `field-sizing` grows the textarea with its content; `minHeight` (from `minRows`) floors it. a
		// `maxRows` cap, when set, scrolls `root` (see `capped`) rather than the textarea, so the textarea never
		// scrolls internally and the preview overlay stays in registration.
		fieldSizing: 'content',
		margin: 0,
		minHeight: rowsHeight(minRowsVar),
		outline: 'none',
		// content always fits (field-sizing), so this only guards against a sub-pixel rounding scrollbar that
		// would let the textarea scroll out of registration with the overlay.
		overflowY: 'hidden',
		position: 'relative',
		resize: 'none',
		width: '100%',
		zIndex: 20,
		selectors: {
			'&::placeholder': { color: vars.palette.contrast_500, opacity: 1 },
		},
	},
]);
