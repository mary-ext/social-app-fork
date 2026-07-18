import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const trigger = style({
	display: 'block',
	position: 'relative',
	outline: 0,
	border: 0,
	backgroundColor: vars.palette.contrast_25,
	padding: 0,
	width: '100%',
	height: 150,
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
	},
});

export const image = style({
	display: 'block',
	width: '100%',
	height: 150,
	objectFit: 'cover',
});

export const editBadge = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'absolute',
	right: 24,
	bottom: 8,
	alignItems: 'center',
	justifyContent: 'center',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	backgroundColor: vars.palette.contrast_25,
	width: 24,
	height: 24,
	color: vars.palette.contrast_1000,
});
