import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { iconSize, space } from '#/styles/tokens.css';

export const aboutSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	borderBottom: `1px solid ${vars.palette.contrast_100}`,
	padding: space.lg,
	paddingTop: 0,
});

export const settingsSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xl,
	padding: space.lg,
});

export const identity = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'flex-start',
});

export const identityText = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	gap: space._2xs,
	paddingBlock: (56 - 50) / 2,
	minWidth: 0,
});

export const likeRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});

export const blockHint = style({
	display: 'flex',
	gap: space.sm,
	alignItems: 'center',
});

export const circleInfoIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.textContrastMedium,
});

export const heartFilledIcon = style({
	width: iconSize.md,
	height: iconSize.md,
	color: colors.negative_400,
});

export const heartIcon = style({
	width: iconSize.md,
	height: iconSize.md,
	color: colors.textContrastMedium,
});
