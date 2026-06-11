import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, REPLY_LINE_WIDTH } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

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

// #region wrappers
/** Hosts the `SubtleHover` overlay (`position: absolute; inset: 0`), which anchors to this box. */
export const hoverWrapper = style({
	cursor: 'pointer',
	position: 'relative',
});
// #endregion

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

export const parentLine = style({
	backgroundColor: colors.borderContrastLow,
	flex: 1,
	marginBottom: space.xs,
	marginLeft: 'auto',
	marginRight: 'auto',
	width: REPLY_LINE_WIDTH,
});

/** The outgoing child reply line below the avatar, continuing the thread downward. */
export const childLine = style({
	backgroundColor: colors.borderContrastLow,
	flex: 1,
	marginLeft: 'auto',
	marginRight: 'auto',
	marginTop: space.xs,
	width: REPLY_LINE_WIDTH,
});
// #endregion

// #region post body
/** The avatar column beside the content. */
export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

export const avatarColumn = style({
	display: 'flex',
	flexDirection: 'column',
});

/** `minWidth: 0` lets the clamped text/name ellipsize. */
export const content = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

/** Below-meta rhythm. `display: flex` so the wrapper doesn't inflate the line box. */
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

/** `display: flex` so the post-text strut doesn't push the embed below down a few px. */
export const richText = style({
	display: 'flex',
	flexDirection: 'column',
	marginBottom: space._2xs,
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
// #endregion
