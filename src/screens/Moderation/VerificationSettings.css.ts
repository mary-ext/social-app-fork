import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const loaderWrap = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	padding: space.lg,
});
