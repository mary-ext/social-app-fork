import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const trigger = style({
	backgroundColor: vars.palette.contrast_25,
	border: 0,
	cursor: 'pointer',
	display: 'block',
	height: '150px',
	outline: 0,
	padding: 0,
	position: 'relative',
	width: '100%',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: '-2px' },
	},
});

export const image = style({
	display: 'block',
	height: '150px',
	objectFit: 'cover',
	width: '100%',
});

/** Circular camera badge pinned to the bottom-right of the banner. */
export const editBadge = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: '12px',
	bottom: '8px',
	boxSizing: 'border-box',
	color: vars.palette.contrast_1000,
	display: 'flex',
	height: '24px',
	justifyContent: 'center',
	position: 'absolute',
	right: '24px',
	width: '24px',
});
