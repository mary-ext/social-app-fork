import { style } from '@vanilla-extract/css';

import { OUTER_SPACE } from '#/screens/PostThread/const';

import { space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	paddingBlock: OUTER_SPACE * 2,
	paddingInline: OUTER_SPACE,
});

export const inner = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xl,
	alignItems: 'center',
	width: '100%',
});

export const textGroup = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});
