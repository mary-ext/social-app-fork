import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

export const link = style({
	display: 'block',
	width: 'fit-content',
	marginBlock: space.sm,
});

export const boxLink = style([link, { marginBlock: 0 }]);

export const status = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.xs,
	marginBlock: space.sm,
});

export const box = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	marginBlock: space.sm,
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.sm,
	padding: space.md,
});

export const header = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.xs,
});

export const headerText = style({
	display: 'flex',
	flex: 1,
	flexWrap: 'wrap',
	alignItems: 'center',
	gap: space._2xs,
	minWidth: 0,
});

export const dismiss = style({
	flexShrink: 0,
	margin: -space.xs,
});

export const arrowIcon = style({
	width: iconSize.xs,
	height: iconSize.xs,
	color: colors.textContrastMedium,
});

export const warningIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
	flexShrink: 0,
	color: colors.textContrastMedium,
});
