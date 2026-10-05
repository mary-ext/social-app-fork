import { createVar, style } from '@vanilla-extract/css';

import { getFittedStyle } from '../tile/fitted-tile';
import { cover } from '../tile/MediaTile.css';

export const ratioVar = createVar();

export const tile = style(getFittedStyle(ratioVar));

export const media = style([cover]);

export const playback = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 'inherit',
	cursor: 'pointer',
});
