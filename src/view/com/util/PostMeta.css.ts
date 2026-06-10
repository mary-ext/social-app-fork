import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// the row carries no external spacing of its own — callers own the rhythm around it. zIndex keeps the author
// links (and the hover card they anchor) above adjacent post content.
export const row = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.xs,
	zIndex: 20,
});

export const avatar = style({
	alignSelf: 'center',
	marginRight: space._2xs,
});

export const author = style({
	alignItems: 'flex-end',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
});

// the display name holds its intrinsic width but never exceeds 70% so the handle always keeps room.
export const name = style({
	flexShrink: 0,
	maxWidth: '70%',
});

export const handle = style({
	flexShrink: 10,
});

export const timestamp = style({
	paddingLeft: space.xs,
	whiteSpace: 'nowrap',
});
