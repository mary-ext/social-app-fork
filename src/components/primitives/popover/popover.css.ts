import { style } from '@vanilla-extract/css';

import * as anchored from '../anchored-popup.css';

export const positioner = style([anchored.autoPositioner]);

export const modalPositioner = style([anchored.autoPositioner, { display: 'block' }]);

export const shrinkingPositioner = style([anchored.autoPositioner, anchored.shrinkingPositioner]);
