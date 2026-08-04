import { style } from '@vanilla-extract/css';

export const trigger = style({
	selectors: {
		'&[data-popup-open]': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
	},
});
