import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const hero = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	paddingBlock: space._2xl,
	paddingInline: space.md,
	textAlign: 'center',
});

export const icon = style({
	color: vars.palette.contrast_400,
});

export const text = style({
	maxWidth: 220,
});
