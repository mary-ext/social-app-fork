import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';

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
		variants: {
			type: {
				apology: { borderColor: vars.palette.contrast_300 },
				error: { borderColor: vars.palette.negative_500 },
				info: { borderColor: vars.palette.contrast_300 },
				tip: { borderColor: vars.palette.primary_500 },
				warning: { borderColor: vars.palette.yellow },
			},
		},
		defaultVariants: { type: 'info' },
	},
	{ debugId: 'outer' },
);

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'flex-start',
});

export const iconWrap = style({
	flexShrink: 0,
});

export const content = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 8,
	justifyContent: 'center',
	paddingRight: 12,
	minHeight: 20,
});
