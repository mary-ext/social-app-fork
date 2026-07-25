import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const imageBox = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: vars.palette.contrast_50,
	aspectRatio: '1',
	width: '100%',
	overflow: 'hidden',
});

export const image = style({
	width: '100%',
	height: '100%',
	objectFit: 'contain',
});

export const form = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	padding: 16,
});

export const counter = style({
	flexShrink: 0,
	fontVariantNumeric: 'tabular-nums',
});

export const srOnly = style({
	position: 'absolute',
	margin: -1,
	border: 0,
	clip: 'rect(0, 0, 0, 0)',
	padding: 0,
	width: 1,
	height: 1,
	overflow: 'hidden',
	whiteSpace: 'nowrap',
});

export const inactiveSave = style({
	color: vars.palette.contrast_400,
});
