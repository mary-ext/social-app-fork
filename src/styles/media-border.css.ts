import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { vars } from '#/styles/contract.css';

const hairline = style({
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	'@media': {
		'(min-resolution: 2dppx)': { borderWidth: 0.5 },
	},
});

export const mediaBorder = style([
	hairline,
	{
		borderColor: vars.palette.contrast_100,
		selectors: {
			'.theme--dark &, .theme--dim &': {
				borderColor: colorMix(vars.palette.contrast_300, '60%'),
			},
		},
	},
]);

export const mediaBorderOpaque = style([hairline, { borderColor: vars.palette.contrast_100 }]);

export const mediaOverlay = style({
	inset: 0,
	pointerEvents: 'none',
	position: 'absolute',
});
