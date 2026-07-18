import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const container = style({
	position: 'relative',
	width: '100%',
	overflow: 'hidden',
});

export const thumb = style({
	position: 'absolute',
	inset: 0,
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

export const overlay = style({
	appearance: 'none',
	display: 'flex',
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 2,
	margin: 0,
	border: 0,
	background: 'transparent',
	padding: 0,
	cursor: 'pointer',
});

export const iframeWrap = style({
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	zIndex: 3,
});

export const iframe = style({
	border: 0,
	width: '100%',
	height: '100%',
});
