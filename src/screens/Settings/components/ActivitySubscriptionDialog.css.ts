import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	marginBottom: space.md,
});

export const radioList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const loaderWrap = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space._2xl,
});
