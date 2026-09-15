import { style } from '@vanilla-extract/css';

import { iconSize } from '#/styles/tokens.css';

export const button = style({
	paddingInline: 8,
	minWidth: 36,
});

export const text = style({
	textTransform: 'uppercase',
});

export const globeIcon = style({
	width: iconSize.xs,
	height: iconSize.xs,
});
