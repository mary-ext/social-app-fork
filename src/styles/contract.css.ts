import { createThemeContract } from '@vanilla-extract/css';

import { DEFAULT_PALETTE } from '#/styles/palette';

/**
 * css-variable contract for the theme, containing auto-generated and scoped variable names. consume via
 * `vars.palette.*` or `vars.shadow.*`.
 */
export const vars = createThemeContract({
	palette: DEFAULT_PALETTE,
	shadow: { dialog: null, lg: null, md: null, sm: null, xs: null },
	/** Tint strengths, as CSS percentages, for translucent state layers (e.g. the `:hover` background). */
	opacity: { hover: null },
});
