import { createVar, style } from '@vanilla-extract/css';

import * as strip from '#/components/ImageEmbed/carousel/strip.css';

import { borderRadius } from '#/styles/tokens.css';

import { getFittedStyle } from '../shared/fitted-tile';
import { cover } from '../shared/MediaTile.css';

export const ratioVar = createVar();

export const single = style(getFittedStyle(ratioVar));

export const stripTile = style([strip.tile, { borderRadius: borderRadius.md }]);

export const image = style([cover]);
