import { style } from '@vanilla-extract/css';

import { iconSize, space } from '#/styles/tokens.css';

export const radioList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const note = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'center',
});

export const circleInfoIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
});
