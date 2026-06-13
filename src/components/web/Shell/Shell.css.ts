import { style } from '@vanilla-extract/css';

import { CENTER_COLUMN_WIDTH } from '#/components/web/Layout/const';

import { vars } from '#/styles/contract.css';

/** Center column plus its 1px left/right borders. */
const CENTER_COLUMN_FRAME = CENTER_COLUMN_WIDTH + 2;

/**
 * Full-height flex column the `<body>` scrolls. Holds the horizontal rail/center grid plus the in-flow bottom
 * bar. `flex-shrink: 0` lets it grow past the viewport with the in-flow screen so the body scrolls and the
 * sticky rails/bar get a tall containing block; `min-height: 100dvh` keeps the bar at the viewport bottom on
 * short pages.
 */
export const root = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	minHeight: '100dvh',
	width: '100%',
});

/**
 * Nav-rail + center-column track set. Equal `1fr` side tracks keep the center column viewport-centered
 * (matching upstream) at widths where both rails fit; the implicit `minmax(auto, 1fr)` lets a rail force its
 * track wider than its share — shrinking the opposite track and shifting the column over — only when it
 * genuinely needs the room (the tablet band, where the right rail is wider than the minimal left rail). The
 * center track fills the viewport below the mobile breakpoint and caps at the column frame above it. `flex: 1
 * 0 auto` fills the viewport on short pages but keeps the grid at its content height on long pages so the
 * rails can stick.
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

/**
 * Sticky nav rail. `max-height: 100dvh` (not `height`) keeps it at its content height so it never forces the
 * grid row taller than the center column; it pins at the top and scrolls internally only when its own content
 * overflows the viewport. Sizes to its content and hugs the center column (`justify-self` set per side).
 */
export const rail = style({
	alignSelf: 'start',
	display: 'flex',
	flexDirection: 'column',
	maxHeight: '100dvh',
	// the rail scrolls vertically, which makes it a scroll container with 0 horizontal min-content; pin its
	// min-width to its content so a `1fr` track grows to fit it (shifting the center column) instead of the
	// rail overflowing the viewport at the tablet band.
	minWidth: 'max-content',
	overflowY: 'auto',
	position: 'sticky',
	scrollbarWidth: 'thin',
	top: 0,
});

/** Left rail hugs the right edge of its track (against the center column). */
export const railLeft = style({
	justifySelf: 'end',
});

/** Right rail hugs the left edge of its track (against the center column). */
export const railRight = style({
	justifySelf: 'start',
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
	zIndex: 10,
});
