import { createGlobalTheme } from '@vanilla-extract/css';

import { DEFAULT_PALETTE, DEFAULT_SUBDUED_PALETTE, invertPalette, type Palette } from '#/styles/palette';

import { vars } from '#/styles/contract.css';

// palette.black is always an opaque 7-char hex, so a fixed 8-digit-hex alpha suffices for shadows.
const alpha = (hex: string, opacity: number) => {
	const a = Math.round(opacity * 255).toString(16);
	return hex + a.padStart(2, a);
};

const shadows = (palette: Palette, opacity: number) => {
	const c = alpha(palette.black, opacity);
	return {
		lg: `0 20px 25px -5px ${c}, 0 8px 10px -6px ${c}`,
		md: `0 10px 15px -3px ${c}, 0 4px 6px -4px ${c}`,
		sm: `0 4px 6px -1px ${c}, 0 2px 4px -2px ${c}`,
		xs: `0 2px 8px 0 ${c}`,
	};
};

const themeValues = (palette: Palette, shadowOpacity: number) => ({
	palette,
	shadow: shadows(palette, shadowOpacity),
});

// assign onto the selectors `useColorModeTheme.ts` / `web/index.html` already toggle on <html>, so the
// new DOM components recolor alongside the RNW ones with no extra switching machinery. mirrors the
// palette inversion + shadow opacity from `createTheme` in `#/alf/base/themes`.
createGlobalTheme('.theme--light', vars, themeValues(DEFAULT_PALETTE, 0.1));
createGlobalTheme('.theme--dark', vars, themeValues(invertPalette(DEFAULT_PALETTE), 0.4));
createGlobalTheme('.theme--dim', vars, themeValues(invertPalette(DEFAULT_SUBDUED_PALETTE), 0.4));
