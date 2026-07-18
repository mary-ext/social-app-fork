import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const loaderWrap = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: space.lg,
});
