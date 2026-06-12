import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const body = style({
	overflow: 'hidden',
	paddingBottom: space.sm,
	paddingInline: space.lg,
	paddingTop: space.md,
});

// the avatar overlaps from the shell, so the button row reserves space on its left.
export const buttonRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.xs,
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

// `vertical-align: middle` anchors to baseline + half x-height, which sits ~5px below the name's
// optical center; lift it back onto the line so it reads centered like the rest of the text.
export const badges = style({
	display: 'inline-flex',
	marginLeft: space.xs,
	position: 'relative',
	top: -5,
	verticalAlign: 'middle',
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
});

export const knownRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});
