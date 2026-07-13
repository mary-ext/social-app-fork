import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/Shell/Shell.css';

export const footer = style({
	paddingBottom: fallbackVar(bottomBarHeightVar, '0px'),
});
