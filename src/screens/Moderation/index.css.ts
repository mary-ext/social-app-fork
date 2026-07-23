import { style } from '@vanilla-extract/css';

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

export const cleanup = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const removeButton = style({
	alignSelf: 'flex-start',
});

export const status = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: space.xl,
});
