import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const footer = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	borderTopColor: vars.palette.contrast_200,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	paddingBlock: space.xs,
	paddingInline: space.lg,
});

export const left = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	marginLeft: -space.sm,
	gap: 4,
});

export const right = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
});

export const charProgress = style({
	width: 54,
});
