import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { roundToPx } from '#/styles/round';
import { borderRadius, fontLeading, fontSize, space } from '#/styles/tokens.css';

// the bar stands in for a line of text: its height tracks the size's font-size (the visible glyph mass) and
// the box keeps the full line-height, so a column of bars holds the same vertical rhythm as the `Text` it
// replaces. both are set per `size` variant from the matching `Text` size.
const fontSizeVar = createVar();
const lineHeightVar = createVar();

/** Bar width, wired inline; defaults to filling the available width. */
export const widthVar = createVar();

/** Box edge length in px, wired inline so a circle/square scales to the `size` prop. */
export const boxSizeVar = createVar();

/** Square corner radius in px, wired inline. */
export const squareRadiusVar = createVar();

/**
 * A loading placeholder for a line of `Text`: a rounded bar sized to the matching `size`'s line box. Each
 * `size` variant publishes that size's font-size and its pixel-snapped line-height (`round(font-size × paired
 * ratio)`) so the placeholder tracks the live typography scale. Unlayered.
 */
export const text = recipe(
	{
		base: {
			alignItems: 'center',
			display: 'flex',
			flexShrink: 0,
			height: lineHeightVar,
			maxWidth: '100%',
			width: fallbackVar(widthVar, 'auto'),
		},
		variants: {
			color: {
				contrast_25: { color: vars.palette.contrast_25 },
				contrast_50: { color: vars.palette.contrast_50 },
				contrast_100: { color: vars.palette.contrast_100 },
			},
			// one variant per `Text` size, each publishing the size's font-size and its pixel-snapped line-height
			// (`round(font-size × paired ratio)`) so the placeholder tracks the live typography scale.
			size: Object.fromEntries(
				(Object.keys(fontLeading) as (keyof typeof fontLeading)[]).map((key) => [
					key,
					{
						vars: {
							[fontSizeVar]: fontSize[key],
							[lineHeightVar]: roundToPx(`calc(${fontSize[key]} * ${fontLeading[key]})`),
						},
					},
				]),
			) as { [K in keyof typeof fontLeading]: { vars: Record<string, string> } },
		},
		defaultVariants: { color: 'contrast_50', size: 'md' },
	},
	{ debugId: 'text' },
);

// the bar is sized to the font-size and vertically centered by the flex parent, so the leftover line-height
// splits into equal margins above and below — the same place the glyphs sit within a real line box.
export const bar = style({
	backgroundColor: 'currentColor',
	borderRadius: borderRadius.md,
	height: roundToPx(fontSizeVar),
	width: '100%',
});

export const circle = recipe(
	{
		base: {
			alignItems: 'center',
			backgroundColor: 'currentColor',
			borderRadius: '50%',
			display: 'flex',
			flexShrink: 0,
			height: boxSizeVar,
			justifyContent: 'center',
			width: boxSizeVar,
		},
		variants: {
			color: {
				contrast_25: { color: vars.palette.contrast_25 },
				contrast_50: { color: vars.palette.contrast_50 },
				contrast_100: { color: vars.palette.contrast_100 },
			},
		},
		defaultVariants: { color: 'contrast_50' },
	},
	{ debugId: 'circle' },
);

export const square = recipe(
	{
		base: {
			backgroundColor: 'currentColor',
			borderRadius: squareRadiusVar,
			flexShrink: 0,
			height: boxSizeVar,
			width: boxSizeVar,
		},
		variants: {
			color: {
				contrast_25: { color: vars.palette.contrast_25 },
				contrast_50: { color: vars.palette.contrast_50 },
				contrast_100: { color: vars.palette.contrast_100 },
			},
		},
		defaultVariants: { color: 'contrast_50' },
	},
	{ debugId: 'square' },
);

/** A horizontal flex group of placeholders. Unlayered. */
export const row = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'row',
		},
		variants: {
			align: {
				center: { alignItems: 'center' },
				start: { alignItems: 'flex-start' },
			},
			gap: {
				md: { gap: space.md },
				sm: { gap: space.sm },
				xs: { gap: space.xs },
			},
		},
	},
	{ debugId: 'row' },
);

/** A flex-1 vertical flex group of placeholders. Unlayered. */
export const col = recipe(
	{
		base: {
			display: 'flex',
			flex: 1,
			flexDirection: 'column',
			minWidth: 0,
		},
		variants: {
			gap: {
				md: { gap: space.md },
				sm: { gap: space.sm },
				xs: { gap: space.xs },
			},
		},
	},
	{ debugId: 'col' },
);
