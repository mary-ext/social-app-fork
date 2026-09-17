import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { withAlpha } from '#/styles/functions';

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
				borderColor: withAlpha(vars.palette.contrast_300, '60%'),
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
