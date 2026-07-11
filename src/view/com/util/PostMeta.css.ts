import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

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
