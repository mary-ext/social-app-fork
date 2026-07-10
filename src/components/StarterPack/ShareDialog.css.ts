import { style } from '@vanilla-extract/css';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { borderRadius } from '#/styles/tokens.css';

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	minHeight: 424,
});

export const image = style({
	aspectRatio: String(CARD_ASPECT_RATIO),
	borderRadius: borderRadius.sm,
	objectFit: 'cover',
	width: '100%',
});
