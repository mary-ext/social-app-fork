import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

/**
 * Thin inset border overlay matching the RNW `MediaInsetBorder`: a hairline that thins to 0.5px on hi-dpi
 * screens (the `@media` query replaces the runtime `IS_HIGH_DPI` check). Light theme uses a solid
 * low-contrast border; dark/dim use a higher-contrast border at 60% opacity.
 */
export const base = style({
	borderRadius: `${borderRadius.md}px`,
	borderStyle: 'solid',
	borderWidth: '1px',
	bottom: 0,
	left: 0,
	pointerEvents: 'none',
	position: 'absolute',
	right: 0,
	top: 0,
	'@media': {
		'(min-resolution: 2dppx)': { borderWidth: '0.5px' },
	},
	selectors: {
		'.theme--light &': { borderColor: vars.palette.contrast_100, opacity: 1 },
		'.theme--dark &, .theme--dim &': { borderColor: vars.palette.contrast_300, opacity: 0.6 },
	},
});

/** Match an adjacent opaque border (used where the border abuts other borders, e.g. link previews). */
export const opaque = style({
	selectors: {
		'&&': { borderColor: vars.palette.contrast_100, opacity: 1 },
	},
});

/** Focus ring for the active carousel slide — a 2px border that wins over the hairline. */
export const focused = style({
	selectors: {
		'&&': { borderWidth: '2px' },
	},
});
