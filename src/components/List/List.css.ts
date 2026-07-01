import { createVar, style } from '@vanilla-extract/css';

/** Off-screen-row placeholder height; set on the container, read by each row's content-visibility hint. */
export const estimateHeightVar = createVar();

/**
 * Content container. `position: relative` anchors the absolute above-the-fold sentinel. Height is left to the
 * content — the surrounding `Layout.Screen` (`min-height: calc(100dvh - bottom bar)`) already fills the
 * viewport, so forcing a viewport min-height here only stacks below the header and creates dead scroll.
 */
export const container = style({
	position: 'relative',
});

/**
 * Universal row wrapper: a flex column (default `align-items: stretch`) so the row's content fills the list
 * width. Without it a shrink-to-fit root — e.g. a `<button>`-rooted row like the composer prompt — would only
 * be as wide as its content, which the old RNW `View` row wrapper avoided.
 */
export const row = style({
	display: 'flex',
	flexDirection: 'column',
});

/**
 * Row modifier: lets the row skip layout/paint while off screen (`content-visibility: auto`), sized by
 * {@link estimateHeightVar} until first rendered, after which the browser remembers its real height.
 *
 * Applied per row (not to every row via the container) so specific rows can opt out — a row whose height is
 * still estimated when it scrolls into view realizes its real size then, shifting everything below it; that
 * is fine mid-list but breaks a scroll-anchor pin if it sits just above the anchor.
 */
export const rowSkip = style({
	// only the block axis is estimated; width stays at the flex-stretched container width.
	containIntrinsicHeight: `auto ${estimateHeightVar}`,
	contentVisibility: 'auto',
});

/**
 * Zero-height marker pinned to the content top, observed to tell whether the list has scrolled away from the
 * top. Inert so it never intercepts pointer or paint.
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
