import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const imageBox = style({
	alignItems: 'center',
	aspectRatio: '1',
	backgroundColor: vars.palette.contrast_50,
	display: 'flex',
	justifyContent: 'center',
	overflow: 'hidden',
	width: '100%',
});

export const image = style({
	height: '100%',
	objectFit: 'contain',
	width: '100%',
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
	border: 0,
	clip: 'rect(0, 0, 0, 0)',
	height: 1,
	margin: -1,
	overflow: 'hidden',
	padding: 0,
	position: 'absolute',
	whiteSpace: 'nowrap',
	width: 1,
});

export const inactiveSave = style({
	color: vars.palette.contrast_400,
});
