import { style } from '@vanilla-extract/css';

import { OUTER_SPACE } from '#/screens/PostThread/const';

import { space } from '#/styles/tokens.css';

export const outer = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	paddingInline: OUTER_SPACE,
	paddingBlock: OUTER_SPACE * 2,
});

export const inner = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.xl,
	width: '100%',
});

export const textGroup = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});
