import { style } from '@vanilla-extract/css';

import * as anchored from '../anchored-popup.css';

export const positioner = style([anchored.positioner]);

export const modalPositioner = style([anchored.positioner, { display: 'block' }]);

export const shrinkingPositioner = style([anchored.positioner, anchored.shrinkingPositioner]);
