import { style } from '@vanilla-extract/css';

import { iconSize, space } from '#/styles/tokens.css';

// keep the description below its trigger without a row divider
export const details = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	paddingBottom: space.md,
	paddingInline: space.lg,
});

export const radioGroup = style({
	display: 'contents',
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
