import { style } from '@vanilla-extract/css';

/** Content container; full document scroll keeps it at least a viewport tall. */
export const container = style({
	minHeight: '100vh',
});

/**
 * Zero-size edge marker observed by an IntersectionObserver to detect when the list start/end nears the
 * viewport. Inert so it never intercepts pointer or paint.
 */
export const sentinel = style({
	pointerEvents: 'none',
	zIndex: -1,
});
