import { style } from '@vanilla-extract/css';

import { leadingOverrideVar } from '#/components/Text.css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { iconSize, lineHeight, space } from '#/styles/tokens.css';

export const dialogHeaderRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
});

export const dialogNameColumn = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
});

export const dialogTitle = style({
	vars: { [leadingOverrideVar]: String(lineHeight.tight) },
});

export const dialogLikedByRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});

export const dialogActionsRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	paddingTop: space.sm,
});

export const dialogActionButton = style({
	flex: '1 1 0%',
});

export const dialogReportSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	paddingTop: space.xs,
});

export const dialogReportRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'space-between',
});

export const dialogWrongText = style({
	fontStyle: 'italic',
});

export const info = style({
	display: 'flex',
	gap: space.sm,
	alignItems: 'center',
	minWidth: 0,
});

export const infoText = style({
	flexGrow: 1,
	minWidth: 0,
});

export const infoMeta = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});

export const infoHandle = style({
	flexShrink: 1,
	minWidth: 0,
});

export const infoLikes = style({
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	gap: 2,
	alignItems: 'center',
});

export const skeletonBar = style({
	borderRadius: 8,
	backgroundColor: vars.palette.contrast_25,
	width: '100%',
	height: 40,
});

export const skeletonPin = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 999,
	backgroundColor: vars.palette.contrast_25,
	width: 33,
	height: 33,
});

export const pinIcon = style({
	width: iconSize.lg,
	height: iconSize.lg,
	color: colors.textContrastLow,
});

export const pinFilledIcon = style({
	width: iconSize.lg,
	height: iconSize.lg,
	color: colors.primary_500,
});

export const heartFilledIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.pink,
});

export const likeIcon = style({
	width: iconSize.xs,
	height: iconSize.xs,
	color: colors.textContrastLow,
});

export const likeIconLiked = style({ color: colors.pink });
