import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const trigger = style({
	appearance: 'none',
	background: 'none',
	border: 'none',
	borderRadius: 999,
	color: vars.palette.yellow,
	cursor: 'pointer',
	display: 'inline-flex',
	margin: 0,
	padding: 0,
	paddingRight: 2,
	selectors: {
		'&:hover, &:active': { opacity: 0.5 },
		'&:disabled': { cursor: 'default' },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
});

export const icon = style({
	color: vars.palette.yellow,
	height: 60,
	overflow: 'hidden',
	width: 64,
});

export const starterPack = style({
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	boxSizing: 'border-box',
	marginTop: 8,
	padding: 16,
	width: '100%',
});
