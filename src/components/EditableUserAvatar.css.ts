import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const sizeVar = createVar();
export const radiusVar = createVar();

export const trigger = style({
	background: 'transparent',
	border: 0,
	borderRadius: radiusVar,
	cursor: 'pointer',
	display: 'block',
	height: sizeVar,
	outline: 0,
	padding: 0,
	position: 'relative',
	width: sizeVar,
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

/** Circular camera badge pinned to the bottom-right corner of the avatar. */
export const editBadge = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	bottom: 0,
	boxSizing: 'border-box',
	color: vars.palette.contrast_1000,
	display: 'flex',
	height: 24,
	justifyContent: 'center',
	position: 'absolute',
	right: 0,
	width: 24,
});
