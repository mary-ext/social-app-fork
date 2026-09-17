import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space, zIndex } from '#/styles/tokens.css';

import { rowBlock, rowInset } from './shared.css';

export const portal = style({
	zIndex: zIndex.modal,
});

export const popup = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'fixed',
	inset: 0,
	flexDirection: 'column',
	transitionDuration: '75ms',
	transitionProperty: 'opacity',
	outline: 'none',
	backgroundColor: vars.palette.contrast_0,
	paddingTop: 'env(safe-area-inset-top, 0px)',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
	},
});

export const body = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	paddingBottom: 'env(safe-area-inset-bottom, 0px)',
	vars: {
		[rowBlock]: `${space.md}px`,
		[rowInset]: `${space.lg}px`,
	},
});
