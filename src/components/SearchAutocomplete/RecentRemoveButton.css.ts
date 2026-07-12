import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const remove = style({
	position: 'absolute',
	// row paddingBlock + lineHeight/2 - buttonHeight/2
	top: 8 + 20 / 2 - 25 / 2,
	right: space.sm,
});
