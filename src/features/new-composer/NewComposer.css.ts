import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontLeading, fontSize, space } from '#/styles/tokens.css';

import { DROP_TINT } from './dnd/drop.css';
import {
	LINE_PLACEHOLDER_ATTR,
	POST_DRAGGING_ATTR,
	POST_DROP_AFTER_ATTR,
	POST_DROP_BEFORE_ATTR,
	POST_DROP_TARGET_ATTR,
	POST_ELEMENT,
} from './elements';
import { AVATAR_SIZE, DRAGGING_OPACITY, POST_GAP_CENTER, RAIL_WIDTH, RIGHT_PADDING } from './layout';

export const root = style({
	position: 'relative',
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

export const facet = style({
	color: vars.text.link,
});

globalStyle(`${root} ${POST_ELEMENT} p[${LINE_PLACEHOLDER_ATTR}]::before`, {
	position: 'absolute',
	pointerEvents: 'none',
	userSelect: 'none',
	color: vars.palette.contrast_500,
	content: `attr(${LINE_PLACEHOLDER_ATTR})`,
});

export const overflow = style({
	backgroundColor: `color-mix(in srgb, ${vars.palette.negative_500} 20%, transparent)`,
});

const slot = style({
	display: 'block',
	whiteSpace: 'normal',
	userSelect: 'none',
});

export const headerSlot = slot;

// drop markers align with the center of this gap.
export const footerSlot = style([slot, { paddingBottom: POST_GAP_CENTER * 2 }]);

// #region drag and drop

// tint the target post; image drops also get an insertion line.
globalStyle(`${root} ${POST_ELEMENT}[${POST_DROP_TARGET_ATTR}]::before`, DROP_TINT);

// keep the first post's tint inside the scroll container.
globalStyle(`${root} ${POST_ELEMENT}:first-of-type[${POST_DROP_TARGET_ATTR}]::before`, {
	top: 0,
});

globalStyle(`${root} ${POST_ELEMENT}[${POST_DRAGGING_ATTR}]`, {
	opacity: DRAGGING_OPACITY,
});

const DROP_DOT_SIZE = 8;
const DROP_LINE_THICKNESS = 2;

// align the dot with the thread line.
const dropMarker = {
	position: 'absolute',
	right: RIGHT_PADDING,
	left: space.lg + AVATAR_SIZE / 2 - DROP_DOT_SIZE / 2,
	height: DROP_DOT_SIZE,
	background: [
		`radial-gradient(circle at ${DROP_DOT_SIZE / 2}px 50%, ${vars.palette.primary_500} ${DROP_DOT_SIZE / 2 - 0.5}px, transparent ${DROP_DOT_SIZE / 2}px)`,
		`linear-gradient(${vars.palette.primary_500}, ${vars.palette.primary_500}) ${DROP_DOT_SIZE / 2}px 50% / 100% ${DROP_LINE_THICKNESS}px no-repeat`,
	].join(', '),
	pointerEvents: 'none',
	content: '""',
} as const;

globalStyle(`${root} ${POST_ELEMENT}[${POST_DROP_BEFORE_ATTR}]::before`, {
	...dropMarker,
	top: -POST_GAP_CENTER - DROP_DOT_SIZE / 2,
});
globalStyle(`${root} ${POST_ELEMENT}[${POST_DROP_AFTER_ATTR}]::after`, {
	...dropMarker,
	bottom: POST_GAP_CENTER - DROP_DOT_SIZE / 2,
});

// #endregion
