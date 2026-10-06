import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

import { DRAGGING_OPACITY } from '../../shared/layout';
import { getFittedStyle } from './fitted-tile';

export const FOCUS_RING_EXTENT = 4;

const FOCUS_RING_OFFSET = 2;

export const tile = style({
	position: 'relative',
	borderRadius: borderRadius.sm,
	overflow: 'hidden',
	backgroundColor: vars.palette.contrast_50,
	selectors: {
		'&:focus-visible': {
			outline: `${FOCUS_RING_EXTENT - FOCUS_RING_OFFSET}px solid ${vars.palette.primary_500}`,
			outlineOffset: FOCUS_RING_OFFSET,
		},
	},
});

export const dragging = style({
	opacity: DRAGGING_OPACITY,
});

/** media filling a tile with a known aspect ratio. */
export const cover = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	pointerEvents: 'none',
});

/** box width-to-height ratio from `getVideoBoxRatio`. */
export const videoRatioVar = createVar();

export const videoTile = style([getFittedStyle(videoRatioVar), { backgroundColor: '#000' }]);

export const contain = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'contain',
	pointerEvents: 'none',
});
