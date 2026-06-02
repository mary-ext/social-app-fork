import { createGlobalThemeContract } from '@vanilla-extract/css';

import { DEFAULT_PALETTE, type Palette } from '#/styles/palette';

type PaletteVarNames = { [K in keyof Palette]: string };

const paletteVarNames = (() => {
	const out = {} as PaletteVarNames;
	for (const key of Object.keys(DEFAULT_PALETTE) as (keyof Palette)[]) {
		out[key] = `p-${key}`;
	}
	return out;
})();

/**
 * Global CSS-variable contract for the theme. Variable *names* only — values are assigned per theme
 * in `theme.css.ts` onto the existing `.theme--{light,dark,dim}` selectors. Consume via
 * `vars.palette.*` (the full palette, which inverts between light/dark) or `vars.shadow.*`.
 */
export const vars = createGlobalThemeContract({
	palette: paletteVarNames,
	shadow: {
		lg: 'shadow-lg',
		md: 'shadow-md',
		sm: 'shadow-sm',
		xs: 'shadow-xs',
	},
});
