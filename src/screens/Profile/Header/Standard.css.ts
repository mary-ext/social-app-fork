import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const body = style({
	paddingTop: space.md,
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
	paddingBottom: space.sm,
	paddingLeft: 90,
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
