import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const footer = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: vars.palette.contrast_200,
	backgroundColor: vars.palette.contrast_0,
	paddingBlock: space.xs,
	paddingInline: space.lg,
});

export const left = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
	alignItems: 'center',
	marginLeft: -space.sm,
});

export const right = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
	alignItems: 'center',
});

export const charProgress = style({
	width: 54,
});
