import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const labelerAvatar = style({
	alignSelf: 'flex-start',
});

export const labelerChevron = style({
	alignSelf: 'flex-start',
	marginTop: (40 - 16) / 2,
});

export const identity = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
});

export const regionalNotice = style({
	alignItems: 'center',
	color: vars.palette.contrast_500,
	display: 'flex',
	fontStyle: 'italic',
	gap: space.xs,
	paddingTop: space._2xs,
});

export const cleanup = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const removeButton = style({
	alignSelf: 'flex-start',
});

export const status = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	padding: space.xl,
});
