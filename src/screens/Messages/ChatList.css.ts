import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const banner = style({ marginBottom: space.sm });

export const empty = style({ justifyContent: 'center', paddingBottom: 40, height: '100%' });

export const emptyTall = style({ justifyContent: 'center', paddingBottom: 120, height: '100%' });
