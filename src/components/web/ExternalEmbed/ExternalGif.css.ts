import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// fixed 300px tall, square-bottomed so it abuts the card body's top border seamlessly (matches RNW).
export const button = style({
	appearance: 'none',
	background: 'transparent',
	border: 0,
	borderBottomLeftRadius: 0,
	borderBottomRightRadius: 0,
	cursor: 'pointer',
	display: 'block',
	height: '300px',
	margin: 0,
	overflow: 'hidden',
	padding: 0,
	position: 'relative',
	width: '100%',
});

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'contain',
	width: '100%',
});

export const overlay = style({
	alignItems: 'center',
	bottom: 0,
	display: 'flex',
	justifyContent: 'center',
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const dim = style({
	bottom: 0,
	left: 0,
	opacity: 0.3,
	position: 'absolute',
	right: 0,
	top: 0,
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_0 },
	},
});
