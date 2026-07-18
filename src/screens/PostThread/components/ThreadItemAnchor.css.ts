import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { OUTER_SPACE } from '#/components/PostLayout.const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const contentHiderChild = style({
	paddingTop: 8,
});

export const identity = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
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
	paddingBottom: space.xs,
	paddingLeft: space.lg,
	height: space.lg,
});

export const parentLineColumn = style({
	display: 'flex',
	flexDirection: 'column',
	width: LINEAR_AVI_WIDTH,
});

export const avatarRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingBottom: space.md,
});

export const primary = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
	minWidth: 0,
});

export const secondary = style({
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	gap: space.lg,
	alignItems: 'center',

	':empty': {
		display: 'none',
	},
});

export const body = style({
	display: 'flex',
	flexDirection: 'column',
});

export const embedPad = style({
	paddingTop: space.xs,
	paddingBottom: space.xs,
});

export const statsRow = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	rowGap: space.sm,
	columnGap: space.lg,
	alignItems: 'center',
	marginTop: space.md,
	borderTopWidth: 1,
	borderBottomWidth: 1,
	borderTopStyle: 'solid',
	borderBottomStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
	borderBottomColor: colors.borderContrastLow,
	paddingTop: space.md,
	paddingBottom: space.md,
});

export const expandedDetails = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'flex-start',
	paddingTop: space.md,
});

export const expandedDetailsRow = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.sm,
	alignItems: 'center',
});

export const archivedPill = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 3,
	alignItems: 'center',
	border: 'none',
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_25,
	paddingTop: 3,
	paddingRight: 6,
	paddingBottom: 3,
	paddingLeft: 6,
	fontFamily: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:hover, &:focus-visible': {
			backgroundColor: colors.contrast_50,
		},
	},
});

export const deletedOuter = style({
	display: 'flex',
	flexDirection: 'column',
	paddingRight: OUTER_SPACE,
	paddingBottom: OUTER_SPACE,
	paddingLeft: OUTER_SPACE,
});

export const deletedOuterRoot = style({
	paddingTop: space.lg,
});

export const deletedRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
	paddingTop: space.md,
	paddingBottom: space.md,
});

export const deletedIcon = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	width: LINEAR_AVI_WIDTH,
	color: colors.textContrastMedium,
});
