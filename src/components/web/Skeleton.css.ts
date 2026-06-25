import { createVar, fallbackVar, style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
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

export const text = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	height: lineHeightVar,
	maxWidth: '100%',
	width: fallbackVar(widthVar, 'auto'),
});

// the bar is sized to the font-size and vertically centered by the flex parent, so the leftover line-height
// splits into equal margins above and below — the same place the glyphs sit within a real line box.
export const bar = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.md,
	height: roundToPx(fontSizeVar),
	width: '100%',
});

/** De-emphasizes a placeholder so a block of them reads as primary line + secondary lines. */
export const blend = style({
	opacity: 0.6,
});

// one variant per `Text` size, each publishing the size's font-size and its pixel-snapped line-height
// (`round(font-size × paired ratio)`) so the placeholder tracks the live typography scale.
export const size = styleVariants(
	Object.fromEntries(
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
);

export const circle = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	borderRadius: '50%',
	display: 'flex',
	flexShrink: 0,
	height: boxSizeVar,
	justifyContent: 'center',
	width: boxSizeVar,
});

export const square = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: squareRadiusVar,
	flexShrink: 0,
	height: boxSizeVar,
	width: boxSizeVar,
});

export const row = style({
	display: 'flex',
	flexDirection: 'row',
});

export const col = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

/** Cross-axis alignment for {@link row}. */
export const align = styleVariants({
	center: { alignItems: 'center' },
	start: { alignItems: 'flex-start' },
});

/** Gap between children, shared by {@link row} and {@link col}. */
export const gap = styleVariants({
	md: { gap: space.md },
	sm: { gap: space.sm },
	xs: { gap: space.xs },
});
