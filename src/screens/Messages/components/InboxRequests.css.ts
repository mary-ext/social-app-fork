import { style } from '@vanilla-extract/css';

import { fontWeight, space } from '#/styles/tokens.css';

export const unreadPill = style({
	fontWeight: fontWeight.bold,
	gap: space.sm,
});
