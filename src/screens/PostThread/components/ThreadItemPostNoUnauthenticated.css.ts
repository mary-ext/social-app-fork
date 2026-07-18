import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { space } from '#/styles/tokens.css';

export const childSpine = style({
	marginTop: space.xs,
});

export const container = style({
	paddingRight: space.lg,
	paddingLeft: space.lg,
});

export const parentSpine = style({
	marginBottom: space.xs,
});

export const parentSpineColumn = style({
	display: 'flex',
	flexDirection: 'column',
	width: LINEAR_AVI_WIDTH,
});

export const parentSpineRow = style({
	display: 'flex',
	flexDirection: 'row',
	height: 12,
});

export const text = style({
	marginBlock: (LINEAR_AVI_WIDTH - 20) / 2,
	fontStyle: 'italic',
});
