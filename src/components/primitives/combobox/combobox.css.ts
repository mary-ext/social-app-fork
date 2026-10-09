import { style } from '@vanilla-extract/css';

import * as anchored from '../anchored-popup.css';

export const positioner = style([anchored.autoPositioner, anchored.shrinkingPositioner]);
