import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	padding: space.xl,
});

export const statusBlock = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	paddingBlock: space._4xl,
});

export const blockHint = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.sm,
});
