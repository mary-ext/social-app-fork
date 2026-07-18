import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { roundToPx } from '#/styles/round';
import { borderRadius, fontLeading, fontSize, space } from '#/styles/tokens.css';

const fontSizeVar = createVar();
const lineHeightVar = createVar();

export const widthVar = createVar();

export const boxSizeVar = createVar();

export const squareRadiusVar = createVar();

export const text = recipe(
	{
		base: {
			display: 'flex',
			flexShrink: 0,
			alignItems: 'center',
			width: fallbackVar(widthVar, 'auto'),
			maxWidth: '100%',
			height: lineHeightVar,
		},
		variants: {
			color: {
				contrast_25: { color: vars.palette.contrast_25 },
				contrast_50: { color: vars.palette.contrast_50 },
				contrast_100: { color: vars.palette.contrast_100 },
			},
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

export const bar = style({
	borderRadius: borderRadius.md,
	backgroundColor: 'currentColor',
	width: '100%',
	height: roundToPx(fontSizeVar),
});

export const circle = recipe(
	{
		base: {
			display: 'flex',
			flexShrink: 0,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: '50%',
			backgroundColor: 'currentColor',
			width: boxSizeVar,
			height: boxSizeVar,
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
			flexShrink: 0,
			borderRadius: squareRadiusVar,
			backgroundColor: 'currentColor',
			width: boxSizeVar,
			height: boxSizeVar,
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
