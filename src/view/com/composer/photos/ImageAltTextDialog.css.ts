import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// square frame, full-bleed to the sheet's content borders, letterboxing the contained image
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

// fixed-width figures so the running count doesn't jitter as digits change
export const counter = style({
	flexShrink: 0,
	fontVariantNumeric: 'tabular-nums',
});

// visually hidden but exposed to assistive tech, for the over-limit live region
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

// muted Save label while there's nothing to save (matches EditProfileDialog's inactive save)
export const inactiveSave = style({
	color: vars.palette.contrast_400,
});
