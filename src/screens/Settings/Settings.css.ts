import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const profileWrap = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
	minHeight: 160,
	paddingBlock: space.md,
	paddingInline: space.xl,
	width: '100%',
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	justifyContent: 'center',
	maxWidth: '100%',
});

export const displayName = style({
	flexShrink: 1,
	minWidth: 0,
	paddingTop: space.sm,
});

export const badges = style({
	marginTop: 8,
});

export const chevron = style({
	color: vars.palette.contrast_500,
	display: 'flex',
	flexShrink: 0,
});

export const accountRow = style({
	position: 'relative',
});

export const avatarPlaceholder = style({
	flexShrink: 0,
	height: 28,
	width: 28,
});

export const handle = style({
	flexGrow: 1,
	minWidth: 0,
	paddingRight: space._2xl,
});

export const menuTrigger = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: 999,
	color: vars.palette.contrast_1000,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	padding: space.xs,
	position: 'absolute',
	right: space.lg,
	top: 10,
	selectors: {
		'&:hover': { background: vars.palette.contrast_25 },
	},
});
