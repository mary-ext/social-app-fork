import { style } from '@vanilla-extract/css';

import { OUTER_SPACE } from '#/screens/PostThread/const';

import { space } from '#/styles/tokens.css';

export const outer = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	padding: OUTER_SPACE,
	paddingTop: OUTER_SPACE * 2,
	width: '100%',
});

export const inner = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.xl,
	maxWidth: 260,
	width: '100%',
});

export const textGroup = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});
