import { style } from '@vanilla-extract/css';

/**
 * Content container. `position: relative` anchors the absolute above-the-fold sentinel. Height is left to the
 * content — the surrounding `Layout.Screen` (`min-height: calc(100dvh - bottom bar)`) already fills the
 * viewport, so forcing a viewport min-height here only stacks below the header and creates dead scroll.
 */
export const container = style({
	position: 'relative',
});

/**
 * Row wrapper for the seen-tracked path: a flex column (default `align-items: stretch`) so the row's content
 * fills the list width. Without it a shrink-to-fit root — e.g. a `<button>`-rooted row like the composer
 * prompt — would only be as wide as its content, which the old RNW `View` row wrapper avoided.
 */
export const row = style({
	display: 'flex',
	flexDirection: 'column',
});

/**
 * Top band, as tall as the header offset, observed to tell whether the list has scrolled past its header.
 * Inert so it never intercepts pointer or paint.
 */
export const aboveTheFold = style({
	insetInline: 0,
	pointerEvents: 'none',
	position: 'absolute',
	top: 0,
	zIndex: -1,
});

/**
 * Zero-size edge marker observed by an IntersectionObserver to detect when the list start/end nears the
 * viewport. Inert so it never intercepts pointer or paint.
 */
export const sentinel = style({
	pointerEvents: 'none',
	zIndex: -1,
});
