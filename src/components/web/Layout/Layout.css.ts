import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/Shell/Shell.css';

export const screen = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	minHeight: `calc(100dvh - ${fallbackVar(bottomBarHeightVar, '0px')})`,
	paddingTop: 'env(safe-area-inset-top, 0px)',
});

export const screenNoInset = style({
	paddingTop: 0,
});

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
});
