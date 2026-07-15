import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingInline: space.lg,
	paddingBottom: space.sm,
});

export const header = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

export const avatar = style({
	display: 'block',
});

export const content = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
	paddingBlock: (56 - 50) / 2,
});

export const joinedRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});
