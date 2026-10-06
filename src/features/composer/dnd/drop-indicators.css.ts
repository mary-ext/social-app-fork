import { globalStyle } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

import {
	POST_DRAGGING_ATTR,
	POST_DROP_AFTER_ATTR,
	POST_DROP_BEFORE_ATTR,
	POST_DROP_GAP_ATTR,
	POST_DROP_TARGET_ATTR,
	POST_OVERLAY_ATTR,
} from '../shared/elements';
import { AVATAR_SIZE, DRAGGING_OPACITY, POST_GAP_CENTER, RIGHT_PADDING } from '../shared/layout';
import { post } from '../shared/post.css';

/** drop-target tint for a post's pseudo-element. */
export const DROP_TINT = {
	position: 'absolute',
	// center the edges in the gaps between posts.
	inset: `-${POST_GAP_CENTER}px ${space.sm}px ${POST_GAP_CENTER}px`,
	borderRadius: borderRadius.md,
	boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${vars.palette.primary_500} 40%, transparent)`,
	backgroundColor: `color-mix(in srgb, ${vars.palette.primary_500} 6%, transparent)`,
	pointerEvents: 'none',
	content: '""',
} as const;

// tint the target post; image drops also get an insertion line.
globalStyle(`${post}[${POST_DROP_TARGET_ATTR}]::before`, DROP_TINT);

// keep the first post's tint inside the scroll container.
globalStyle(`${post}:first-of-type[${POST_DROP_TARGET_ATTR}]::before`, {
	top: 0,
});

globalStyle(`${post}[${POST_DRAGGING_ATTR}], [${POST_OVERLAY_ATTR}][${POST_DRAGGING_ATTR}]`, {
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

// draw on overlays to keep markers above the editor's thread lines.
globalStyle(`[${POST_OVERLAY_ATTR}][${POST_DROP_BEFORE_ATTR}]::before`, {
	...dropMarker,
	top: -POST_GAP_CENTER - DROP_DOT_SIZE / 2,
});

globalStyle(`[${POST_OVERLAY_ATTR}][${POST_DROP_AFTER_ATTR}]::after`, {
	...dropMarker,
	bottom: POST_GAP_CENTER - DROP_DOT_SIZE / 2,
});

// keep the transition outside the gap selector so closing also animates.
globalStyle(post, {
	transition: 'margin-top 150ms ease-out',
});

// keep the first post's marker inside the scroll container.
globalStyle(`${post}[${POST_DROP_GAP_ATTR}]`, {
	marginTop: POST_GAP_CENTER * 2,
});
