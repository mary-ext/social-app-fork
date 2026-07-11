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
			alignItems: 'center',
			background: 'none',
			border: 'none',
			borderRadius: 999,
			boxSizing: 'border-box',
			color: vars.palette.contrast_700,
			cursor: 'pointer',
			display: 'flex',
			flexDirection: 'row',
			flexShrink: 0,
			maxWidth: '100%',
			minWidth: 0,
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
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 4,
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: 3,
	paddingInline: 6,
});
