import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const button = style({
	appearance: 'none',
	display: 'block',
	position: 'relative',
	margin: 0,
	border: 0,
	borderBottomLeftRadius: 0,
	borderBottomRightRadius: 0,
	background: 'transparent',
	padding: 0,
	width: '100%',
	height: 300,
	overflow: 'hidden',
	cursor: 'pointer',
});

export const image = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'contain',
});

export const overlay = style({
	display: 'flex',
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	alignItems: 'center',
	justifyContent: 'center',
});

export const dim = style({
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	opacity: 0.3,
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_0 },
	},
});
