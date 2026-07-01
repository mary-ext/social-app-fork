import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { OUTER_SPACE } from '#/components/PostLayout.const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const contentHiderChild = style({
	paddingTop: 8,
});

// the handle + badges beside the avatar. min-width:0 lets the clamped handle ellipsize instead of
// pushing the trailing controls off the row.
export const identity = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	minWidth: 0,
});

// the badges keep their intrinsic size; only the handle beside them shrinks.
export const badges = style({
	flexShrink: 0,
	paddingLeft: 6,

	':empty': {
		display: 'none',
	},
});

// the handle is the anchor's identity line; it shrinks within the identity row so its clamp ellipsizes
// instead of shoving the badges out.
export const handle = style({
	minWidth: 0,
});

export const labelsOnMe = style({
	paddingBottom: space.sm,
});

export const postAlerts = style({
	paddingBottom: space.sm,
});

// #region parent reply line
export const parentLineRow = style({
	// border-box so `height` is the outer 16px (12px line + 4px paddingBottom),
	// matching RN's always-border-box box model. content-box renders it 20px.
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	height: space.lg,
	paddingBottom: space.xs,
	paddingLeft: space.lg,
});

export const parentLineColumn = style({
	display: 'flex',
	flexDirection: 'column',
	width: LINEAR_AVI_WIDTH,
});
// #endregion

// #region header row
export const avatarRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	justifyContent: 'space-between',
	paddingBottom: space.md,
});

// the avatar + identity cluster on the left; min-width:0 lets it shrink so the handle ellipsizes
// rather than pushing the trailing controls off the row.
export const primary = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	minWidth: 0,
});

// the trailing controls on the right; holds its intrinsic width against the shrinking primary cluster.
export const secondary = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	gap: space.lg,

	':empty': {
		display: 'none',
	},
});

/** The post body below the header row. */
export const body = style({
	display: 'flex',
	flexDirection: 'column',
});

/** Trailing room around the embed when there's post text above it. */
export const embedPad = style({
	paddingBottom: space.xs,
	paddingTop: space.xs,
});
// #endregion

// #region engagement stats
export const statsRow = style({
	alignItems: 'center',
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	columnGap: space.lg,
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	marginTop: space.md,
	paddingBottom: space.md,
	paddingTop: space.md,
	rowGap: space.sm,
});
// #endregion

// #region expanded details
export const expandedDetails = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingTop: space.md,
});

export const expandedDetailsRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.sm,
});

export const archivedPill = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.full,
	display: 'flex',
	flexDirection: 'row',
	gap: 3,
	paddingBottom: 3,
	paddingLeft: 6,
	paddingRight: 6,
	paddingTop: 3,
});

export const archivedPillActive = style({
	backgroundColor: colors.contrast_50,
});
// #endregion

// #region deleted
export const deletedOuter = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: OUTER_SPACE,
	paddingLeft: OUTER_SPACE,
	paddingRight: OUTER_SPACE,
});

export const deletedOuterRoot = style({
	paddingTop: space.lg,
});

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
// #endregion
