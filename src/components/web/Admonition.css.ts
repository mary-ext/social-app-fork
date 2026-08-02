import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { iconSize } from '#/styles/tokens.css';

export const outer = recipe(
	{
		base: {
			boxSizing: 'border-box',
			borderWidth: 1,
			borderStyle: 'solid',
			borderRadius: 8,
			backgroundColor: vars.palette.contrast_0,
			padding: 12,
		},
		defaultVariants: { type: 'info' },
		variants: {
			type: {
				apology: { borderColor: vars.palette.contrast_300 },
				error: { borderColor: vars.palette.negative_500 },
				info: { borderColor: vars.palette.contrast_300 },
				tip: { borderColor: vars.palette.primary_500 },
				warning: { borderColor: vars.palette.yellow },
			},
		},
	},
	{ debugId: 'outer' },
);

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'flex-start',
});

const iconBase = style({
	flexShrink: 0,
	width: iconSize.lg,
	height: iconSize.lg,
});

export const iconWrap = styleVariants(
	{
		apology: vars.palette.contrast_700,
		error: vars.palette.negative_500,
		info: vars.palette.contrast_700,
		tip: vars.palette.primary_500,
		warning: vars.palette.yellow,
	},
	(color) => [iconBase, { color }],
);

export const content = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 8,
	justifyContent: 'center',
	paddingRight: 12,
	minHeight: 20,
});
