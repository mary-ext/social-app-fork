import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

// matches the web header's min-height (Layout/Header.css `outer`), so the sticky search row pins directly
// beneath the sticky header rather than under the viewport top.
const HEADER_HEIGHT = 52;

// #region steps shell
/** Sticky search row above a step's result list, pinned under the header. */
export const searchBar = style({
	backgroundColor: colors.bg,
	borderBottom: `1px solid ${colors.borderContrastMedium}`,
	boxSizing: 'border-box',
	height: 60,
	paddingBlock: space.sm,
	paddingInline: space.md,
	position: 'sticky',
	top: HEADER_HEIGHT,
	zIndex: zIndex.sticky,
});

/** Centered empty/loading slot shown in place of a step's rows. */
export const empty = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	marginTop: space.lg,
	paddingInline: space.lg,
});

export const emptyText = style({
	marginTop: space.lg,
});
// #endregion

// #region details step
export const details = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xl,
	marginTop: space._4xl,
	paddingInline: space.xl,
});

export const detailsHeader = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	marginBottom: space.md,
	paddingInline: space.md,
});

export const detailsSubtitle = style({
	paddingInline: space.md,
});

// fixed-width figures so the running count doesn't jitter as digits change
export const counter = style({
	flexShrink: 0,
	fontVariantNumeric: 'tabular-nums',
});

export const detailsNext = style({
	marginBottom: space.lg,
	marginInline: space.xl,
	marginTop: 35,
});
// #endregion

// #region footer
/**
 * step footer pinned to the viewport bottom. sits at the bottom when the list is short or empty, and sticks
 * to the bottom when the content overflows.
 */
export const footer = style({
	alignItems: 'center',
	backgroundColor: colors.bg,
	borderTop: `1px solid ${colors.borderContrastMedium}`,
	bottom: 0,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	marginTop: 'auto',
	paddingBottom: `calc(${space.lg}px + env(safe-area-inset-bottom, 0px))`,
	paddingInline: space.lg,
	paddingTop: space.xl,
	position: 'sticky',
	zIndex: zIndex.sticky,
});

export const countBadge = style({
	position: 'absolute',
	right: 14,
	top: 31,
});

export const avatarRow = style({
	display: 'flex',
	flexDirection: 'row',
});

/** Per-avatar ring; the overlap/spacing offset is applied inline since it varies by step and index. */
export const avatarRing = style({
	borderColor: colors.bg,
	borderRadius: '50%',
	borderStyle: 'solid',
	borderWidth: 0.5,
});

export const helperText = style({
	textAlign: 'center',
});

export const feedsEmptyHelper = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const cta = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xl,
	marginTop: space.md,
	width: '100%',
});

export const ctaButton = style({
	width: '100%',
});
// #endregion
