import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';

export const row = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'row',
			flexWrap: 'wrap',
		},
		variants: {
			size: {
				lg: { gap: 5 },
				sm: { gap: 3 },
			},
		},
		defaultVariants: { size: 'sm' },
	},
	{ debugId: 'row' },
);

export const pill = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'row',
			flexShrink: 0,
			alignItems: 'center',
			border: 'none',
			borderRadius: 999,
			background: 'none',
			minWidth: 0,
			maxWidth: '100%',
			color: vars.palette.contrast_700,
			cursor: 'pointer',
			selectors: {
				'&:active': { backgroundColor: vars.palette.contrast_50 },
				'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
				'&:hover': { backgroundColor: vars.palette.contrast_50 },
			},
		},
		variants: {
			bg: {
				false: {},
				true: { backgroundColor: vars.palette.contrast_25 },
			},
			size: {
				lg: { gap: 5, padding: 5 },
				sm: { gap: 3, padding: 3 },
			},
		},
		defaultVariants: { bg: true, size: 'sm' },
	},
	{ debugId: 'pill' },
);

export const pillText = style({
	paddingRight: 3,
});

export const followsYou = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 4,
	backgroundColor: vars.palette.contrast_50,
	paddingBlock: 3,
	paddingInline: 6,
});
