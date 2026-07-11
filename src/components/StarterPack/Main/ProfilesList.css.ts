import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/web/Shell/Shell.css';

// clears the footer of the bottom bar on narrow viewports (the shell publishes 0 on desktop).
export const footer = style({
	paddingBottom: fallbackVar(bottomBarHeightVar, '0px'),
});
