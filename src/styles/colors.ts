import { vars } from '#/styles/contract.css';

/**
 * color values for `color`, `background`, `borderColor`, and `fill` style properties. exposes the full themed
 * palette plus semantic aliases (`text`, `bg`, `border*`), which resolve to themed CSS variables to support
 * theme inversion.
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
