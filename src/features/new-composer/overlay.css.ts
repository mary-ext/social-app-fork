import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';

// keep contrast over media in either theme.
const OVERLAY_BACKGROUND = 'rgba(0, 0, 0, 0.72)';
const OVERLAY_HOVER_BACKGROUND = 'rgba(0, 0, 0, 0.85)';

// an odd-sized box centers 13px icons at integer offsets.
export const OVERLAY_SIZE = 27;

export const overlay = style({
	backgroundColor: OVERLAY_BACKGROUND,
	color: vars.palette.white,
	selectors: {
		[hover()]: { backgroundColor: OVERLAY_HOVER_BACKGROUND },
	},
});

export const roundButton = style({
	borderRadius: 999,
	width: OVERLAY_SIZE,
	height: OVERLAY_SIZE,
	padding: 0,
});

export const overlayButton = style([overlay, roundButton]);

// 13px scales the glyphs' 2-unit strokes to roughly 1px.
export const overlayIcon = style({
	display: 'block',
	width: 13,
	height: 13,
});
