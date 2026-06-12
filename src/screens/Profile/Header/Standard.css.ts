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

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.xs,
});

// centering the badges on the name's line box sits them 1px above the upstream inline-in-text
// placement; nudge down 1px to match.
export const badges = style({
	position: 'relative',
	top: 1,
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
