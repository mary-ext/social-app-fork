import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const nav = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	display: 'flex',
	overflowX: 'auto',
	paddingBlock: space.xs,
	paddingInline: space.sm,
	scrollPaddingInline: space.sm,
});

export const navButton = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: '1px solid transparent',
	borderRadius: 8,
	color: vars.palette.contrast_700,
	cursor: 'pointer',
	display: 'flex',
	flex: '0 0 auto',
	height: 36,
	justifyContent: 'center',
	width: 36,
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_50 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}` },
		'&[data-disabled]': { cursor: 'default', opacity: 0.4 },
		'&[data-pressed]': { color: vars.palette.primary_600 },
	},
});
