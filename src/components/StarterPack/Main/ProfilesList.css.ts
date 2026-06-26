import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/web/Shell/Shell.css';

// clears the footer of the bottom bar on narrow viewports (the shell publishes 0 on desktop); drops the
// divider since this list footer sits flush at the end of the starter-pack profiles list.
export const footer = style({
	borderTopWidth: 0,
	paddingBottom: fallbackVar(bottomBarHeightVar, '0px'),
});
