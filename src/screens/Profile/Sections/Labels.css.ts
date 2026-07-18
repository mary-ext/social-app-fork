import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	padding: space.xl,
});

export const statusBlock = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	paddingBlock: space._4xl,
});

export const blockHint = style({
	display: 'flex',
	gap: space.sm,
	alignItems: 'center',
});
