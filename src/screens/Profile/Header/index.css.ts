import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

import { AVATAR_OVERHANG } from './Shell.css';

const bodyPaddingTop = space.md;
const buttonRowPaddingBottom = space.sm;

export const body = style({
	paddingTop: bodyPaddingTop,
	paddingBottom: space.sm,
	paddingInline: space.lg,
	overflow: 'hidden',
});

export const buttonRow = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.xs,
	alignItems: 'center',
	justifyContent: 'flex-end',
	paddingBottom: buttonRowPaddingBottom,
	paddingLeft: 90,
	// keep the name below the avatar
	minHeight: AVATAR_OVERHANG - bodyPaddingTop - buttonRowPaddingBottom,
});

export const nameBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	paddingBottom: space.sm,
});

export const nameBlockLive = style({
	paddingTop: space.sm,
});

export const nameBlockDefault = style({
	paddingTop: space._2xs,
});

export const badges = style({
	display: 'inline-flex',
	position: 'relative',
	top: -5,
	marginLeft: space.xs,
	verticalAlign: 'middle',
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
});

export const knownRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});
