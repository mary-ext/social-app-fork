import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// the row carries no external spacing of its own — callers own the rhythm around it.
export const row = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.xs,
	minWidth: 0,
});

export const avatar = style({
	alignSelf: 'center',
	marginRight: space._2xs,
});

export const badges = style({
	alignSelf: 'center',
	paddingLeft: 6,
});

// every shrinkable item below also sets `minWidth: 0` to defeat the `min-width: auto` flex default, which
// otherwise floors each item at its min-content width — a long, unbroken name or handle would overrun its
// constraint and run offscreen instead of ellipsizing.
export const author = style({
	alignItems: 'flex-end',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
	minWidth: 0,
});

export const handle = style({
	flexShrink: 10,
	minWidth: 0,
});

export const timestamp = style({
	paddingLeft: space.sm,
	whiteSpace: 'nowrap',
});
