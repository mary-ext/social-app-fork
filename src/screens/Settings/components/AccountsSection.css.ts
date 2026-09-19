import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { iconSize, space } from '#/styles/tokens.css';

export const avatarStack = style({
	display: 'flex',
	marginBlock: -2,
});

const OVERFLOW_SIZE = iconSize.sm + space.xs * 2;

export const menuSpace = style({
	flexShrink: 0,
	width: OVERFLOW_SIZE,
});

export const overflow = style({
	appearance: 'none',
	display: 'flex',
	position: 'absolute',
	top: '50%',
	right: space.md,
	alignItems: 'center',
	justifyContent: 'center',
	transform: 'translateY(-50%)',
	border: 'none',
	borderRadius: 999,
	background: 'transparent',
	padding: 0,
	width: OVERFLOW_SIZE,
	height: OVERFLOW_SIZE,
	color: vars.palette.contrast_500,
	cursor: 'pointer',
	selectors: {
		[hover()]: { background: vars.palette.contrast_100 },
	},
});

export const menuIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
});
