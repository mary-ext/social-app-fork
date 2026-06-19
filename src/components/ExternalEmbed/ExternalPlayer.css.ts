import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const container = style({
	overflow: 'hidden',
	position: 'relative',
	width: '100%',
});

export const thumb = style({
	inset: 0,
	position: 'absolute',
});

// darkens the thumbnail/placeholder behind the play affordance at 0.3 opacity.
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

export const overlay = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 0,
	bottom: 0,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	left: 0,
	margin: 0,
	padding: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 2,
});

export const iframeWrap = style({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 3,
});

export const iframe = style({
	border: 0,
	height: '100%',
	width: '100%',
});
