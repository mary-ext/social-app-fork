import { createVar, fallbackVar, style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { borderRadius, fontLeading, fontSize } from '#/styles/tokens.css';

// line box height for the placeholder, set by the `size` variant from the matching `Text` size so the bar
// occupies the same vertical footprint as the line it stands in for.
const lineHeightVar = createVar();

/** Bar width, wired inline; defaults to filling the available width. */
export const widthVar = createVar();

/** Circle edge length in px, wired inline so the circle scales to the `size` prop. */
export const circleSizeVar = createVar();

export const text = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	height: lineHeightVar,
	maxWidth: '100%',
	width: fallbackVar(widthVar, 'auto'),
});

// the bar fills 70% of the line box, centered by the flex parent — the same 15%/15% inset the line had.
export const bar = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.md,
	height: roundToPx(`calc(${lineHeightVar} * 0.7)`),
	width: '100%',
});

// one variant per `Text` size, each publishing the size's pixel-snapped line-height (`round(font-size ×
// paired ratio)`) so the placeholder tracks the live typography scale.
export const size = styleVariants(
	Object.fromEntries(
		(Object.keys(fontLeading) as (keyof typeof fontLeading)[]).map((key) => [
			key,
			{ vars: { [lineHeightVar]: roundToPx(`calc(${fontSize[key]} * ${fontLeading[key]})`) } },
		]),
	) as { [K in keyof typeof fontLeading]: { vars: Record<string, string> } },
);

export const circle = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	borderRadius: '50%',
	display: 'flex',
	flexShrink: 0,
	height: circleSizeVar,
	justifyContent: 'center',
	width: circleSizeVar,
});
