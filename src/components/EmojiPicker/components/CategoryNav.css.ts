import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const nav = style({
	display: 'flex',
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	paddingBlock: space.xs,
	paddingInline: space.sm,
	overflowX: 'auto',
	scrollPaddingInline: space.sm,
});

export const navButton = style({
	appearance: 'none',
	display: 'flex',
	flex: '0 0 auto',
	alignItems: 'center',
	justifyContent: 'center',
	border: '1px solid transparent',
	borderRadius: 8,
	background: 'transparent',
	width: 36,
	height: 36,
	color: vars.palette.contrast_700,
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_50 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}` },
		'&[data-disabled]': { opacity: 0.4, cursor: 'default' },
		'&[data-pressed]': { color: vars.palette.primary_600 },
	},
});
