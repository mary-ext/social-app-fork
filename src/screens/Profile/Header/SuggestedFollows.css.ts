import { style } from '@vanilla-extract/css';

export const panel = style({
	boxSizing: 'border-box',
	height: 'var(--collapsible-panel-height)',
	overflow: 'hidden',
	transitionDuration: '300ms',
	transitionProperty: 'height',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': {
			height: 0,
		},
	},
});
