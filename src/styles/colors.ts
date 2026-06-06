import { vars } from '#/styles/contract.css';

/**
 * Color values for `color`/`background`/`borderColor`/`fill` style properties. Exposes the full themed
 * palette plus the semantic aliases (`text`, `bg`, `border*`); all resolve to themed CSS vars, so they invert
 * with the active theme.
 */
export const colors = {
	...vars.palette,
	bg: vars.palette.contrast_0,
	borderContrastHigh: vars.palette.contrast_300,
	borderContrastLow: vars.palette.contrast_100,
	borderContrastMedium: vars.palette.contrast_200,
	text: vars.palette.contrast_1000,
	textContrastHigh: vars.palette.contrast_900,
	textContrastLow: vars.palette.contrast_400,
	textContrastMedium: vars.palette.contrast_700,
	textInverted: vars.palette.contrast_0,
	transparent: 'transparent',
};
