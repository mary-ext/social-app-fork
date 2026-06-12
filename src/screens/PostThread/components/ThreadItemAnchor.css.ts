import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, OUTER_SPACE, REPLY_LINE_WIDTH } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

/** The anchor post row; GalleryBleed measures this host and clips the image-carousel bleed to it. */
export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	paddingLeft: OUTER_SPACE,
	paddingRight: OUTER_SPACE,
});

/** Extra top space when the anchor is the thread root. */
export const outerRootPad = style({
	paddingTop: space.lg,
});

export const contentHiderChild = style({
	paddingTop: 8,
});

// the author column sits between the avatar and the follow button. min-width:0 lets it shrink so the
// clamped name/handle ellipsize instead of shoving the follow button off the row.
export const header = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
});

// the badges keep their intrinsic size; only the name beside them shrinks.
export const badges = style({
	flexShrink: 0,
	paddingLeft: space.xs,
});

// the display name shrinks within the name row so its clamp ellipsizes instead of shoving the badges out.
export const displayName = style({
	minWidth: 0,
});

// isolate the handle's bidi so an RTL display name above it can't flip the `@handle`. hugs its content
// (rather than stretching the header column) and never exceeds the column width.
export const handle = style({
	alignSelf: 'flex-start',
	direction: 'ltr',
	maxWidth: '100%',
	unicodeBidi: 'isolate',
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

export const parentLine = style({
	backgroundColor: colors.borderContrastLow,
	flexGrow: 1,
	marginLeft: 'auto',
	marginRight: 'auto',
	width: REPLY_LINE_WIDTH,
});
// #endregion

// #region header row
export const avatarRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	paddingBottom: space.md,
});

/** Vertically centers the follow button against the avatar/identity block. */
export const followCell = style({
	alignSelf: 'center',
});

/** The post body below the header row. */
export const body = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: space.sm,
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

/** Nudges the big control bar left so the leading icon optically aligns with the text above. */
export const controlsWrap = style({
	marginLeft: -5,
	paddingBottom: space._2xs,
	paddingTop: space.sm,
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
