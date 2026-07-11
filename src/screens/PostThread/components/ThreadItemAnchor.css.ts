import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { OUTER_SPACE } from '#/components/PostLayout.const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const contentHiderChild = style({
	paddingTop: 8,
});

export const identity = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	minWidth: 0,
});

export const badges = style({
	flexShrink: 0,
	paddingLeft: 6,

	':empty': {
		display: 'none',
	},
});

export const handle = style({
	minWidth: 0,
});

export const labelsOnMe = style({
	paddingBottom: space.sm,
});

export const postAlerts = style({
	paddingBottom: space.sm,
});

export const parentLineRow = style({
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

export const avatarRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	justifyContent: 'space-between',
	paddingBottom: space.md,
});

export const primary = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	minWidth: 0,
});

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

export const body = style({
	display: 'flex',
	flexDirection: 'column',
});

export const embedPad = style({
	paddingBottom: space.xs,
	paddingTop: space.xs,
});

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
	border: 'none',
	borderRadius: borderRadius.full,
	cursor: 'pointer',
	display: 'flex',
	fontFamily: 'inherit',
	flexDirection: 'row',
	gap: 3,
	paddingBottom: 3,
	paddingLeft: 6,
	paddingRight: 6,
	paddingTop: 3,
	selectors: {
		'&:hover, &:focus-visible': {
			backgroundColor: colors.contrast_50,
		},
	},
});

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
