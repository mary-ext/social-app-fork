import { style } from '@vanilla-extract/css';

export const panel = style({
	boxSizing: 'border-box',
	transitionDuration: '300ms',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
});
