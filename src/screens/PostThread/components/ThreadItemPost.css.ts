import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, OUTER_SPACE } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

/**
 * Linear-thread-specific layout. The shared row / column / spine / frame structure lives in
 * `#/components/PostLayout`; what remains here is the incoming/outgoing reply spine geometry, the per-element
 * body rhythm, and the deleted-post chrome.
 */

/** Chrome for the PostHider warning row on the linear thread surface. */
export const hider = style({
	backgroundColor: 'transparent',
	paddingLeft: 0,
	paddingRight: space._2xs,
});

/** Margin on the PostHider icon circle so it lines up with the avatar column. */
export const hiderIcon = style({
	marginRight: space.xs,
});

// #region reply lines
/** Spacer row above the avatar that carries the incoming parent reply line. */
export const parentLineRow = style({
	display: 'flex',
	flexDirection: 'row',
	height: 12,
});

export const parentLineColumn = style({
	display: 'flex',
	flexDirection: 'column',
	width: LINEAR_AVI_WIDTH,
});

/** Trailing gap below the incoming spine, before the avatar row. */
export const parentLine = style({
	marginBottom: space.xs,
});

/** Leading gap above the outgoing spine, below the avatar. */
export const childLine = style({
	marginTop: space.xs,
});
// #endregion

// #region body rhythm
export const metaSpacing = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: space.xs,
});

export const labelsOnMe = style({
	paddingBottom: space.xs,
});

export const postAlerts = style({
	paddingBottom: space._2xs,
});

export const embed = style({
	paddingBottom: space.xs,
});
// #endregion

// #region deleted
export const deletedRow = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.sm,
	display: 'flex',
	flexDirection: 'row',
	paddingBottom: space.md,
	paddingTop: space.md,
});

export const deletedIcon = style({
	alignItems: 'center',
	color: colors.textContrastMedium,
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'center',
	width: LINEAR_AVI_WIDTH,
});

export const deletedSpacer = style({
	height: 4,
});

/** Padding-block for the loading skeleton; `OUTER_SPACE / 1.5` matches the old RNW vertical padding. */
export const skeleton = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBlock: OUTER_SPACE / 1.5,
	paddingInline: OUTER_SPACE,
});
// #endregion
