import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontLeading, fontSize } from '#/styles/tokens.css';

import { LINE_PLACEHOLDER_ATTR, POST_ELEMENT } from './shared/elements';
import { AVATAR_SIZE, RAIL_WIDTH, RIGHT_PADDING } from './shared/layout';

export const root = style({
	position: 'relative',
	margin: 0,
	border: 'none',
	padding: 0,
	minInlineSize: 0,
	// the editor draws its own caret in `currentColor`.
	color: vars.palette.contrast_1000,
});

globalStyle(`${root} wg-content`, {
	padding: 0,
	lineHeight: fontLeading.md,
	fontSize: fontSize.md,
});

globalStyle(`${root} ${POST_ELEMENT}`, {
	display: 'block',
	position: 'relative',
	paddingLeft: RAIL_WIDTH,
	minHeight: AVATAR_SIZE,
});

globalStyle(`${root} ${POST_ELEMENT} p`, {
	margin: 0,
	marginRight: RIGHT_PADDING,
});

globalStyle(`${root} ${POST_ELEMENT} p[${LINE_PLACEHOLDER_ATTR}]::before`, {
	position: 'absolute',
	pointerEvents: 'none',
	userSelect: 'none',
	color: vars.palette.contrast_500,
	content: `attr(${LINE_PLACEHOLDER_ATTR})`,
});
