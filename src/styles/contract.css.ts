import { createThemeContract } from '@vanilla-extract/css';

import { DEFAULT_PALETTE } from '#/styles/palette';

export const vars = createThemeContract({
	palette: DEFAULT_PALETTE,
	shadow: { dialog: null, lg: null, md: null, sm: null, xs: null },
	opacity: { hover: null },
});
