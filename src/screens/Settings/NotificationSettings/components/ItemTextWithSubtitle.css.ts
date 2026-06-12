import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	gap: space._2xs,
	minWidth: 0,
});

export const containerBold = style({
	gap: space.xs,
});

export const skeleton = style({
	alignSelf: 'flex-start',
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 8,
	height: 12,
	marginBlock: 2,
	width: 120,
});
