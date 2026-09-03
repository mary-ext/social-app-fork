import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { iconSize, space } from '#/styles/tokens.css';

export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	gap: space.lg,
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space._5xl,
	paddingInline: space.lg,
	minHeight: 0,
	textAlign: 'center',
});

export const icon = style({
	width: iconSize._2xl,
	height: iconSize._2xl,
	color: vars.palette.contrast_400,
});

export const message = style({
	maxWidth: '38ch',
});

export const actions = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'center',
	flexWrap: 'wrap',
	marginTop: space.xs,
});
