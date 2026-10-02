import { createVar, style } from '@vanilla-extract/css';

import { getFittedStyle } from '../shared/fitted-tile';
import { cover } from '../shared/MediaTile.css';

export const ratioVar = createVar();

export const tile = style(getFittedStyle(ratioVar));

export const image = style([cover]);
