import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, fontLeading, fontSize, space } from '#/styles/tokens.css';

import { RIGHT_PADDING } from './consts';
import {
	LINE_PLACEHOLDER_ATTR,
	POST_DROP_AFTER_ATTR,
	POST_DROP_BEFORE_ATTR,
	POST_DROP_TARGET_ATTR,
	POST_ELEMENT,
} from './elements';
import { AVATAR_SIZE } from './PostRail.css';

export const root = style({
	position: 'relative',
	// the editor draws its own caret in `currentColor`.
	color: vars.palette.contrast_1000,
});

globalStyle(`${root} wg-content`, {
	padding: 0,
	lineHeight: fontLeading.lg,
	fontSize: fontSize.lg,
});

globalStyle(`${root} ${POST_ELEMENT}`, {
	display: 'block',
	position: 'relative',
	paddingLeft: space.lg + AVATAR_SIZE + space.md,
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

export const footerSlot = style([slot, { paddingBottom: space.sm }]);

globalStyle(`${root} ${POST_ELEMENT}[${POST_DROP_TARGET_ATTR}]`, {
	outline: `2px dashed ${vars.palette.primary_500}`,
	outlineOffset: space.xs,
	borderRadius: borderRadius.sm,
});

const dropMarker = {
	position: 'absolute',
	left: 0,
	right: 0,
	backgroundColor: vars.palette.primary_500,
	height: 3,
	content: '""',
} as const;

globalStyle(`${root} ${POST_ELEMENT}[${POST_DROP_BEFORE_ATTR}]::before`, { ...dropMarker, top: 0 });
globalStyle(`${root} ${POST_ELEMENT}[${POST_DROP_AFTER_ATTR}]::after`, { ...dropMarker, bottom: 0 });
