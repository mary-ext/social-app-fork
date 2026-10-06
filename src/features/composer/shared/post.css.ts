import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import { LINE_PLACEHOLDER_ATTR } from './elements';
import { AVATAR_SIZE, RAIL_WIDTH, RIGHT_PADDING } from './layout';

export const post = style({
	display: 'block',
	position: 'relative',
	paddingLeft: RAIL_WIDTH,
	minHeight: AVATAR_SIZE,
});

globalStyle(`${post} p`, {
	margin: 0,
	marginRight: RIGHT_PADDING,
});

globalStyle(`${post} p[${LINE_PLACEHOLDER_ATTR}]::before`, {
	position: 'absolute',
	pointerEvents: 'none',
	userSelect: 'none',
	color: vars.palette.contrast_500,
	content: `attr(${LINE_PLACEHOLDER_ATTR})`,
});
