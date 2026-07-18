import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const accountRow = style({
	position: 'relative',
});

export const identity = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const primaryText = style({
	minWidth: 0,
});

export const nameLine = style({
	display: 'flex',
	gap: 6,
	alignItems: 'center',
	minWidth: 0,
});

export const avatarStack = style({
	display: 'flex',
	marginBlock: -2,
});

export const accountAvatar = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	marginBlock: -4,
});

export const handle = style({
	flex: 1,
	paddingInlineEnd: space._4xl,
	minWidth: 0,
});

export const avatarPlaceholder = style({
	flexShrink: 0,
	borderRadius: 999,
	backgroundColor: vars.palette.contrast_50,
	width: 28,
	height: 28,
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
	padding: space.xs,
	color: vars.palette.contrast_500,
	cursor: 'pointer',
	selectors: {
		'&:hover': { background: vars.palette.contrast_100 },
	},
});
