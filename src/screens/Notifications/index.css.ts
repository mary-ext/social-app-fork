import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize } from '#/styles/tokens.css';

export const warning = style({
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: 12,
	paddingInline: 16,
});

export const editBigIcon = style({
	width: iconSize.xl,
	height: iconSize.xl,
	color: colors.white,
});
