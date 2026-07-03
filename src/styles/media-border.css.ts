import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { vars } from '#/styles/contract.css';

// thins to a hairline on hi-dpi screens, matching the device pixel grid.
const hairline = style({
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	'@media': {
		'(min-resolution: 2dppx)': { borderWidth: 0.5 },
	},
});

/**
 * themed hairline that separates media from the background. compose onto the rounded media element itself so
 * a focus ring on the same box stays concentric with it.
 */
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

/** Opaque hairline variant (where the border abuts other opaque borders, e.g. an avatar inside a card). */
export const mediaBorderOpaque = style([hairline, { borderColor: vars.palette.contrast_100 }]);

/** absolute-fill positioning for overlaying a hairline border when the image has a blur filter */
export const mediaOverlay = style({
	inset: 0,
	pointerEvents: 'none',
	position: 'absolute',
});
