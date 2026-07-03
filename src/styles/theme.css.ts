import { assignVars, globalStyle } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { DEFAULT_PALETTE, DEFAULT_SUBDUED_PALETTE, invertPalette, type Palette } from '#/styles/palette';
import { fontFamily } from '#/styles/tokens.css';

// palette.black is always an opaque 7-char hex, so a fixed 8-digit-hex alpha suffices for shadows.
const alpha = (hex: string, opacity: number) => {
	const a = Math.round(opacity * 255).toString(16);
	return hex + a.padStart(2, a);
};

const shadows = (palette: Palette, opacity: number) => {
	const c = alpha(palette.black, opacity);
	return {
		// the soft, offsetless glow shared by every modal surface.
		dialog: `0 0 30px ${c}`,
		lg: `0 20px 25px -5px ${c}, 0 8px 10px -6px ${c}`,
		md: `0 10px 15px -3px ${c}, 0 4px 6px -4px ${c}`,
		sm: `0 4px 6px -1px ${c}, 0 2px 4px -2px ${c}`,
		xs: `0 2px 8px 0 ${c}`,
	};
};

const themeValues = (palette: Palette, shadowOpacity: number, hoverOpacity: string) => ({
	opacity: { hover: hoverOpacity },
	palette,
	shadow: shadows(palette, shadowOpacity),
});

// assign onto the selectors `useColorModeTheme.ts` / `web/index.html` already toggle on <html>, so
// components recolor by class with no extra switching machinery. dark/dim invert the palette and run a
// heavier shadow opacity. the hover tint also lightens as the surface darkens.
globalStyle('.theme--light', { vars: assignVars(vars, themeValues(DEFAULT_PALETTE, 0.1, '50%')) });
globalStyle('.theme--dark', {
	vars: assignVars(vars, themeValues(invertPalette(DEFAULT_PALETTE), 0.4, '40%')),
});
globalStyle('.theme--dim', {
	vars: assignVars(vars, themeValues(invertPalette(DEFAULT_SUBDUED_PALETTE), 0.4, '45%')),
});

// the authoritative page background, consuming the theme contract so it tracks `.theme--*` like every other
// surface. `web/index.html` paints an approximate background on <html> (the viewport canvas) for the
// pre-hydration splash; this rule owns <body> — the scroll container — so its color covers the full
// scrollable area, and since the splash only colors <html> there's no specificity contest once the bundle
// loads.
globalStyle('body', {
	backgroundColor: vars.palette.contrast_0,
	fontFamily,
});
