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
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	paddingBlock: space.xs,
	width: '100%',
});

export const switchLabel = style({
	flexGrow: 1,
	minWidth: 0,
});

export const divider = style({
	marginBlock: space.sm,
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	width: '100%',
});

export const radioList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const loaderWrap = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	paddingTop: space._5xl,
	width: '100%',
});
