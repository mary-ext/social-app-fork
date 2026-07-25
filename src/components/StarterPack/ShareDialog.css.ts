import { style } from '@vanilla-extract/css';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { borderRadius } from '#/styles/tokens.css';

export const card = style({
	borderRadius: borderRadius.sm,
	aspectRatio: String(CARD_ASPECT_RATIO),
	width: '100%',
});
