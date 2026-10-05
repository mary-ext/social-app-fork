import { style } from '@vanilla-extract/css';

import { fontLeading, fontSize } from '#/styles/tokens.css';

import { POST_GAP_CENTER, RAIL_WIDTH } from '../shared/layout';

// hidden so Android's caret handle picks the nearest text line instead of the spacer's edge.
export const spacer = style({
	display: 'block',
	visibility: 'hidden',
	marginLeft: -RAIL_WIDTH,
	userSelect: 'none',
});

// avoid creating a containing block between overlays and their spacer anchors.
export const layer = style({
	display: 'contents',
});

// let Android's caret handle hit the post beneath; hitting overlay content dismisses the keyboard.
export const post = style({
	position: 'absolute',
	pointerEvents: 'none',
	userSelect: 'none',
	lineHeight: fontLeading.md,
	fontSize: fontSize.md,
});

/** restores pointer events for overlay controls. */
export const control = style({
	pointerEvents: 'auto',
});

export const header = style({
	paddingLeft: RAIL_WIDTH,
});

export const footer = style({
	position: 'absolute',
	right: 0,
	bottom: 0,
	left: RAIL_WIDTH,
	paddingBottom: POST_GAP_CENTER * 2,
});
