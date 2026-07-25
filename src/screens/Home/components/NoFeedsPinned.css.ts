import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const actions = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	justifyContent: 'center',
	gap: space.md,
});

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	flexGrow: 1,
	minHeight: 0,
	paddingBlock: space._2xl,
	paddingInline: space.xl,
});

export const description = style({
	maxWidth: 340,
});

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: space.sm,
	paddingBottom: space.xl,
});
