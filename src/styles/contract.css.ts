import { createThemeContract } from '@vanilla-extract/css';

import { LIGHT_PALETTE } from '#/styles/palette';

export const vars = createThemeContract({
	palette: LIGHT_PALETTE,
	shadow: { dialog: null, lg: null, md: null, sm: null, xs: null },
	opacity: { hover: null },
	text: { link: null },
});
