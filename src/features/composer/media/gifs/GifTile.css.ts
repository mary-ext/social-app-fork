import { createVar, style } from '@vanilla-extract/css';

import { getFittedStyle } from '../tile/fitted-tile';
import { cover } from '../tile/MediaTile.css';

export const ratioVar = createVar();

export const tile = style(getFittedStyle(ratioVar));

export const image = style([cover]);
