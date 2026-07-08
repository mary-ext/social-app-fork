import { style } from '@vanilla-extract/css';

/** content container. */
export const container = style({
	position: 'relative',
});

/** flex column wrapper that ensures row content stretches to fill the list width. */
export const row = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	contain: 'content',
});

/**
 * zero-height marker pinned to the content top, observed to tell whether the list has scrolled away from the
 * top. inert so it never intercepts pointer or paint.
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
