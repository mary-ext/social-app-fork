import { style } from '@vanilla-extract/css';

import { fontWeight, space } from '#/styles/tokens.css';

export const unreadPill = style({
	gap: space.sm,
	fontWeight: fontWeight.bold,
});
