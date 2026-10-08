import { style } from '@vanilla-extract/css';

import { positioner as anchoredPositioner } from '../anchored-popup.css';

export const positioner = style([anchoredPositioner]);

export const modalPositioner = style([anchoredPositioner, { display: 'block' }]);
