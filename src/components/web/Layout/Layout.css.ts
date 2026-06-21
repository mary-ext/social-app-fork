import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/web/Shell/Shell.css';

export const screen = style({
	// a flex column so a `flex: 1` child (e.g. a Tabs pager) fills the screen height instead of collapsing to
	// its content — short feeds/empty states then cover the viewport rather than leaving dead space below.
	display: 'flex',
	flexDirection: 'column',
	// don't let the surrounding viewport-height flex shell shrink the screen below its content: it must
	// grow to its full content height so a sticky header stays stuck the whole way down a long page.
	flexShrink: 0,
	// subtract the in-flow bottom bar (published by the shell) so a short screen fills exactly the space
	// above the bar — no dead scroll — while still clearing it. the var is 0 when there's no bar.
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
