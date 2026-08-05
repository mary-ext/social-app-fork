import { assignVars, globalStyle } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { DARK_PALETTE, DIM_PALETTE, LIGHT_PALETTE, type Palette } from '#/styles/palette';
import { fontFamily } from '#/styles/tokens.css';

// shadows tint from pure black in every theme, so this never had to ride along as a themed palette entry
const SHADOW_BASE = '#000000';

const alpha = (hex: string, opacity: number) => {
	const a = Math.round(opacity * 255).toString(16);
	return hex + a.padStart(2, a);
};

const shadows = (opacity: number) => {
	const c = alpha(SHADOW_BASE, opacity);
	return {
		dialog: `0 0 30px ${c}`,
		lg: `0 20px 25px -5px ${c}, 0 8px 10px -6px ${c}`,
		md: `0 10px 15px -3px ${c}, 0 4px 6px -4px ${c}`,
		sm: `0 4px 6px -1px ${c}, 0 2px 4px -2px ${c}`,
		xs: `0 2px 8px 0 ${c}`,
	};
};

interface ThemeOptions {
	hoverOpacity: string;
	/**
	 * palette step for link text. the dark palettes mirror the light one around each ramp's midpoint, so
	 * `primary_500` is the same color in every theme and lands near the 4.5:1 floor on dark backgrounds — the
	 * darker themes step up to keep link text legible.
	 */
	linkStep: 'primary_500' | 'primary_600';
	palette: Palette;
	shadowOpacity: number;
}

const themeValues = ({ hoverOpacity, linkStep, palette, shadowOpacity }: ThemeOptions) => ({
	opacity: { hover: hoverOpacity },
	palette,
	shadow: shadows(shadowOpacity),
	text: { link: palette[linkStep] },
});

globalStyle('.theme--light', {
	vars: assignVars(
		vars,
		themeValues({
			hoverOpacity: '50%',
			linkStep: 'primary_500',
			palette: LIGHT_PALETTE,
			shadowOpacity: 0.1,
		}),
	),
});
globalStyle('.theme--dark', {
	vars: assignVars(
		vars,
		themeValues({
			hoverOpacity: '40%',
			linkStep: 'primary_600',
			palette: DARK_PALETTE,
			shadowOpacity: 0.4,
		}),
	),
});
globalStyle('.theme--dim', {
	vars: assignVars(
		vars,
		themeValues({
			hoverOpacity: '45%',
			linkStep: 'primary_600',
			palette: DIM_PALETTE,
			shadowOpacity: 0.4,
		}),
	),
});

globalStyle('body', {
	backgroundColor: vars.palette.contrast_0,
	fontFamily,
});
