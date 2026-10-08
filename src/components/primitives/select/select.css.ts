import { style } from '@vanilla-extract/css';

import * as anchored from '../anchored-popup.css';

export const positioner = style([anchored.positioner, anchored.shrinkingPositioner]);

export const itemAlignedPositioner = style([anchored.manualPositioner, anchored.shrinkingPositioner]);
