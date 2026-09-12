import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const track = style({
	overflow: 'hidden',
	borderRadius: 999,
	backgroundColor: vars.palette.contrast_100,
	width: '100%',
	height: 6,
});

export const fill = style({
	transitionDuration: '200ms',
	transitionProperty: 'width',
	transitionTimingFunction: 'ease-out',
	borderRadius: 'inherit',
	backgroundColor: vars.palette.primary_500,
	height: '100%',
});
