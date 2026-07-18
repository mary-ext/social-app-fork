import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	paddingInline: space.xl,
});

export const title = style({
	paddingTop: space.md,
	paddingBottom: space.sm,
});

export const description = style({
	paddingBottom: space.xl,
});

export const errorBox = style({
	borderRadius: borderRadius.md,
	backgroundColor: vars.palette.contrast_25,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const actions = style({
	display: 'flex',
	flexDirection: 'row',
	paddingTop: space._2xl,
});
