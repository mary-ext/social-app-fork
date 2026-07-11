import { style } from '@vanilla-extract/css';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { vars } from '#/styles/contract.css';

export const frame = style({
	display: 'block',
	overflow: 'hidden',
	position: 'relative',
});

export const cardFrame = style({
	aspectRatio: String(CARD_ASPECT_RATIO),
	width: '100%',
});

export const image = style({
	display: 'block',
	height: '100%',
	inset: 0,
	objectFit: 'cover',
	position: 'absolute',
	width: '100%',
});

export const loading = style({ opacity: 0 });

export const fallback = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	color: vars.palette.contrast_400,
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
});
