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
	alignItems: 'center',
	display: 'flex',
	gap: 6,
	minWidth: 0,
});

export const avatarStack = style({
	display: 'flex',
	marginBlock: -2,
});

export const accountAvatar = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	marginBlock: -4,
});

export const handle = style({
	flex: 1,
	minWidth: 0,
	paddingInlineEnd: space._4xl,
});

export const avatarPlaceholder = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 999,
	flexShrink: 0,
	height: 28,
	width: 28,
});

export const overflow = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: 999,
	color: vars.palette.contrast_500,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	padding: space.xs,
	position: 'absolute',
	right: space.md,
	top: '50%',
	transform: 'translateY(-50%)',
	selectors: {
		'&:hover': { background: vars.palette.contrast_100 },
	},
});
