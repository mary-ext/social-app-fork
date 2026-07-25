import { assignVars, globalStyle } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { DEFAULT_PALETTE, DEFAULT_SUBDUED_PALETTE, invertPalette, type Palette } from '#/styles/palette';
import { fontFamily } from '#/styles/tokens.css';

const alpha = (hex: string, opacity: number) => {
	const a = Math.round(opacity * 255).toString(16);
	return hex + a.padStart(2, a);
};

const shadows = (palette: Palette, opacity: number) => {
	const c = alpha(palette.black, opacity);
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
	 * palette step for link text. `invertPalette` mirrors around the midpoint, so `primary_500` comes out
	 * unchanged on the dark backgrounds and lands near the 4.5:1 floor there — the darker themes step up to
	 * keep link text legible.
	 */
	linkStep: 'primary_500' | 'primary_600';
	palette: Palette;
	shadowOpacity: number;
}

const themeValues = ({ hoverOpacity, linkStep, palette, shadowOpacity }: ThemeOptions) => ({
	opacity: { hover: hoverOpacity },
	palette,
	shadow: shadows(palette, shadowOpacity),
	text: { link: palette[linkStep] },
});

globalStyle('.theme--light', {
	vars: assignVars(
		vars,
		themeValues({
			hoverOpacity: '50%',
			linkStep: 'primary_500',
			palette: DEFAULT_PALETTE,
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
			palette: invertPalette(DEFAULT_PALETTE),
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
			palette: invertPalette(DEFAULT_SUBDUED_PALETTE),
			shadowOpacity: 0.4,
		}),
	),
});

globalStyle('body', {
	backgroundColor: vars.palette.contrast_0,
	fontFamily,
});
