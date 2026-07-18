import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const row = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
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

export const author = style({
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
	alignItems: 'flex-end',
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
