import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const channels = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const switchRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	paddingBlock: space.xs,
	width: '100%',
});

export const switchLabel = style({
	flexGrow: 1,
	minWidth: 0,
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	marginBlock: space.sm,
	width: '100%',
});

export const radioList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const loaderWrap = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	paddingTop: space._5xl,
	width: '100%',
});
