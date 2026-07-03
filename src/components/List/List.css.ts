import { createVar, style } from '@vanilla-extract/css';

/** Off-screen-row placeholder height; set on the container, read by each row's content-visibility hint. */
export const estimateHeightVar = createVar();

/** content container. */
export const container = style({
	position: 'relative',
});

/** flex column wrapper that ensures row content stretches to fill the list width. */
export const row = style({
	display: 'flex',
	flexDirection: 'column',
});

/**
 * lets the row skip layout/paint while off screen using `content-visibility: auto`, sized by
 * {@link estimateHeightVar} until first rendered.
 *
 * Applied per row so specific rows can opt out to avoid breaking scroll-anchor pins when scrolling into view.
 */
export const rowSkip = style({
	// only the block axis is estimated; width stays at the flex-stretched container width.
	containIntrinsicHeight: `auto ${estimateHeightVar}`,
	contentVisibility: 'auto',
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
