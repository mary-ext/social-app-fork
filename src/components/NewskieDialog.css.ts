import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { iconSize } from '#/styles/tokens.css';

export const trigger = style({
	appearance: 'none',
	display: 'inline-flex',
	margin: 0,
	border: 'none',
	borderRadius: 999,
	background: 'none',
	padding: 0,
	paddingRight: 2,
	color: vars.palette.yellow,
	cursor: 'pointer',
	selectors: {
		[hover()]: { opacity: 0.5 },
		'&:disabled': { cursor: 'default' },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
});

export const icon = style({
	width: 64,
	height: 60,
	overflow: 'hidden',
	color: vars.palette.yellow,
});

export const starterPack = style({
	boxSizing: 'border-box',
	marginTop: 8,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	padding: 16,
	width: '100%',
});

export const triggerIcon = style({
	width: iconSize.xl,
	height: iconSize.xl,
});

export const headerIcon = style({
	width: iconSize._5xl,
	height: iconSize._5xl,
});
