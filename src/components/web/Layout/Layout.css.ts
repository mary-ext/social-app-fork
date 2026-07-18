import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/Shell/Shell.css';

import { recipe } from '#/styles/recipe';

export const screen = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			flexShrink: 0,
			paddingTop: 'env(safe-area-inset-top, 0px)',
			minHeight: `calc(100dvh - ${fallbackVar(bottomBarHeightVar, '0px')})`,
		},
		defaultVariants: {
			noInsetTop: false,
			withinSplitView: false,
		},
		variants: {
			noInsetTop: {
				false: {},
				true: { paddingTop: 0 },
			},
			// within the messages split view the screen fills a height-bounded column, so cap it instead of
			// growing to 100dvh — that lets an inner `flex: 1` region scroll rather than overflowing the shell
			withinSplitView: {
				false: {},
				true: { maxHeight: '100%' },
			},
		},
	},
	{ debugId: 'screen' },
);

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
});
