import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

import { rowBlock, rowInset } from './shared.css';

export const body = style({
	overscrollBehavior: 'contain',
	vars: {
		[rowBlock]: `${space.md}px`,
		[rowInset]: `${space.lg}px`,
	},
});
