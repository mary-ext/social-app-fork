import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const heading = style({
	paddingBottom: `${space.xl}px`,
	paddingLeft: `${space.xl}px`,
	paddingRight: `${space.xl}px`,
	paddingTop: `${space.sm}px`,
});
