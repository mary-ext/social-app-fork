import { style } from '@vanilla-extract/css';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { vars } from '#/styles/contract.css';
import { iconSize } from '#/styles/tokens.css';

export const frame = style({
	display: 'block',
	position: 'relative',
	overflow: 'hidden',
});

export const cardFrame = style({
	aspectRatio: String(CARD_ASPECT_RATIO),
	width: '100%',
});

export const image = style({
	display: 'block',
	position: 'absolute',
	inset: 0,
	width: '100%',
	height: '100%',
	objectFit: 'cover',
});

export const loading = style({ opacity: 0 });

export const fallback = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: vars.palette.contrast_25,
	color: vars.palette.contrast_400,
});

export const imageIcon = style({
	width: iconSize._3xl,
	height: iconSize._3xl,
});
