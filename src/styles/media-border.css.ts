import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { vars } from '#/styles/contract.css';

const hairline = style({
	boxSizing: 'border-box',
	borderWidth: 1,
	borderStyle: 'solid',
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
	position: 'absolute',
	inset: 0,
	pointerEvents: 'none',
});
