import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { TOUCH } from '#/styles/interaction';
import { fontLeading, fontSize } from '#/styles/tokens.css';

export const root = style({
	position: 'relative',
	margin: 0,
	border: 'none',
	padding: 0,
	minInlineSize: 0,
	// the editor draws its own caret in `currentColor`.
	color: vars.palette.contrast_1000,
});

// Gboard's space bar swipe can select text outside the thread and dismiss the keyboard.
// disable selection outside the editor while the composer is open on touch devices.
globalStyle(`${TOUCH} body:has(${root})`, {
	userSelect: 'none',
});

globalStyle(`${root} wg-content`, {
	padding: 0,
	userSelect: 'text',
	lineHeight: fontLeading.md,
	fontSize: fontSize.md,
});
