import { createVar, style } from '@vanilla-extract/css';

import { CENTER_COLUMN_WIDTH } from '#/components/web/Layout/const';

import { vars } from '#/styles/contract.css';
import { zIndex } from '#/styles/tokens.css';

/** Center column plus its 1px left/right borders. */
const CENTER_COLUMN_FRAME = CENTER_COLUMN_WIDTH + 2;

/**
 * the bottom bar's measured height (or 0 when no bar), published by `WebShell` onto the shell root. allows
 * screens and fixed overlays to clear the in-flow bar without a hardcoded inset; consume via `fallbackVar`.
 */
export const bottomBarHeightVar = createVar();

/**
 * a full-height flex column that allows the `<body>` to scroll. holds the horizontal rail/center grid plus
 * the in-flow bottom bar.
 */
export const root = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	minHeight: '100dvh',
	width: '100%',
});

/**
 * nav-rail and center-column track set.
 *
 * use equal `1fr` side tracks to keep the center column viewport-centered when both rails fit. implicit
 * `minmax(auto, 1fr)` allows a rail to expand its track and shift the column when needed (e.g., tablet band).
 * the center track fills the viewport below the mobile breakpoint and caps at the column frame above it. uses
 * `flex: 1 0 auto` to fill the viewport on short pages while keeping the grid at content height on long pages
 * so rails can stick.
 */
export const body = style({
	display: 'grid',
	flex: '1 0 auto',
	gridTemplateColumns: 'auto minmax(0, 100%) auto',
	justifyContent: 'center',
	minWidth: 0,
	'@media': {
		'screen and (min-width: 800px)': {
			gridTemplateColumns: `1fr minmax(0, ${CENTER_COLUMN_FRAME}px) 1fr`,
		},
	},
});

/** sticky nav rail. pins at the top and scrolls internally only when its own content overflows the viewport. */
export const rail = style({
	alignSelf: 'start',
	display: 'flex',
	flexDirection: 'column',
	maxHeight: '100dvh',
	overflowY: 'auto',
	position: 'sticky',
	scrollbarWidth: 'thin',
	top: 0,
});

/** pins the min-width of the left rail to its content when scrolling, preventing overflow in the 1fr track */
export const railLeft = style({
	justifySelf: 'end',
	minWidth: 'max-content',
});

/** Right rail hugs the left edge of its track (against the center column). */
export const railRight = style({
	justifySelf: 'start',
});

export const railRightFluid = style({
	maxWidth: 300 + 24 * 2,
	minWidth: 280,
	width: '100%',
});

/**
 * Center column cell. Carries the column borders past the mobile breakpoint (border-box: 602 outer = 600 +
 * 2px).
 */
export const main = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	minWidth: 0,
	'@media': {
		'screen and (min-width: 800px)': {
			borderLeft: `1px solid ${vars.palette.contrast_100}`,
			borderRight: `1px solid ${vars.palette.contrast_100}`,
		},
	},
});

/** In-flow bottom bar: sticks to the viewport bottom while scrolling, rests at content end on short pages. */
export const bottomBar = style({
	bottom: 0,
	position: 'sticky',
	width: '100%',
	zIndex: zIndex.sticky,
});

// #region chat (messages) mode
// chat screens (the wide split view, and a narrow single conversation) are a fixed-viewport layout: the
// shell doesn't scroll, the message list / chat list scroll inside their own bounded columns. These
// modifiers are applied last so they win the cascade over the base scrolling layout.

/** Pin the shell to the viewport instead of growing with content, so inner columns own the scroll. */
export const rootFixed = style({
	height: '100dvh',
	overflow: 'hidden',
});

/** Bound the grid to the viewport (a single row that fills it) so the chat column can size to it. */
export const bodyFixed = style({
	flex: 1,
	gridTemplateRows: '1fr',
	minHeight: 0,
});

/**
 * size the center cell to the split view, center it in the viewport, and nudge the column right to balance
 * the nav, matching upstream. wrapped in media queries to override `body` rules.
 */
export const bodyWide = style({
	'@media': {
		'screen and (min-width: 800px)': {
			gridTemplateColumns: '1fr auto 1fr',
			transform: 'translateX(20px)',
		},
		'screen and (min-width: 1100px) and (max-width: 1300px)': {
			transform: 'translateX(40px)',
		},
	},
});

/** Center cell in fixed mode: clip overflow so the inner list scrolls instead of growing the cell. */
export const mainFixed = style({
	minHeight: 0,
	overflow: 'hidden',
});

/**
 * The split view draws its own column borders, so drop the center cell's (wrapped to beat `main`'s media
 * rule).
 */
export const mainPlain = style({
	'@media': {
		'screen and (min-width: 800px)': {
			borderLeft: 'none',
			borderRight: 'none',
		},
	},
});
// #endregion
