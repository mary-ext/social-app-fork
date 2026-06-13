import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// the row carries no external spacing of its own — callers own the rhythm around it.
export const row = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.xs,
});

export const avatar = style({
	alignSelf: 'center',
	marginRight: space._2xs,
});

export const badges = style({
	alignSelf: 'center',
	paddingLeft: 2,
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

// the display name holds its intrinsic width but never exceeds 70% so the handle always keeps room.
export const name = style({
	flexShrink: 0,
	maxWidth: '70%',
	minWidth: 0,
});

export const handle = style({
	flexShrink: 10,
	minWidth: 0,
});

// a flex item by virtue of `.author`; without this it blockifies to a line box whose strut is sized by
// the inherited 16px / `line-height: normal` (~20px) rather than the tight-leading dot + link inside it.
// `flex` makes it hug its children (~17px), matching the name/handle wrapper beside it.
export const timestamp = style({
	alignItems: 'flex-end',
	display: 'flex',
	paddingLeft: space.xs,
	whiteSpace: 'nowrap',
});
