import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

import { DRAGGING_OPACITY } from '../layout';

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
