import { createThemeContract } from '@vanilla-extract/css';

import { DEFAULT_PALETTE } from '#/styles/palette';

/**
 * CSS-variable contract for the theme — variable _names_ only, auto-generated and scoped by VE (so they can't
 * collide with the hand-authored theme vars in `web/index.html`). Values are assigned per theme in
 * `theme.css.ts` onto the existing `.theme--{light,dark,dim}` selectors. The palette shape is borrowed from
 * `DEFAULT_PALETTE` (its values are ignored; only the keys matter). Consume via `vars.palette.*` (the full
 * palette, which inverts between light/dark) or `vars.shadow.*`.
 */
export const vars = createThemeContract({
	palette: DEFAULT_PALETTE,
	shadow: { dialog: null, lg: null, md: null, sm: null, xs: null },
	/** Tint strengths, as CSS percentages, for translucent state layers (e.g. the `:hover` background). */
	opacity: { hover: null },
});
