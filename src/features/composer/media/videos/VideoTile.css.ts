import { style } from '@vanilla-extract/css';

import { contain, videoRatioVar, videoTile } from '../tile/MediaTile.css';

export const ratioVar = videoRatioVar;

export const tile = style([videoTile]);

export const video = style([contain]);
