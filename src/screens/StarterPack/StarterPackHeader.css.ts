import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBottom: space.sm,
	paddingInline: space.lg,
});

export const header = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'flex-start',
});

export const avatar = style({
	display: 'block',
});

export const content = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	gap: space._2xs,
	paddingBlock: (56 - 50) / 2,
	minWidth: 0,
});

export const joinedRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});
