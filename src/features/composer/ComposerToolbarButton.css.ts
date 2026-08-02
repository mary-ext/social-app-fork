import { style } from '@vanilla-extract/css';

import { iconSize } from '#/styles/tokens.css';

export const button = style({
	padding: 0,
	width: 36,
	height: 36,
});

export const icon = style({
	width: iconSize.lg,
	height: iconSize.lg,
});
