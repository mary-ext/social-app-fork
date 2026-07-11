import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/web/Shell/Shell.css';

export const footer = style({
	paddingBottom: fallbackVar(bottomBarHeightVar, '0px'),
});
