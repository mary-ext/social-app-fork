import { style } from '@vanilla-extract/css';

import { CENTER_COLUMN_WIDTH } from '#/components/web/Layout/const';

export const screen = style({
	// don't let the surrounding viewport-height flex shell shrink the screen below its content: it must
	// grow to its full content height so a sticky header stays stuck the whole way down a long page.
	flexShrink: 0,
	// subtract the in-flow bottom bar (published by the shell) so a short screen fills exactly the space
	// above the bar — no dead scroll — while still clearing it. `--bottom-bar-height` is 0 when no bar.
	minHeight: 'calc(100dvh - var(--bottom-bar-height, 0px))',
	paddingTop: 'env(safe-area-inset-top, 0px)',
});

export const screenNoInset = style({
	paddingTop: 0,
});

export const content = style({
	width: '100%',
});

/** Centers the screen content within the shell's center column. */
export const center = style({
	boxSizing: 'border-box',
	marginInline: 'auto',
	maxWidth: CENTER_COLUMN_WIDTH,
	width: '100%',
});
