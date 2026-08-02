import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

export const pill = style({
	display: 'inline-flex',
	flexDirection: 'row',
	alignItems: 'center',
	alignSelf: 'flex-start',
	gap: space.xs,
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_50,
	paddingBlock: 6,
	paddingInline: space.sm,
	textDecoration: 'none',
	color: colors.text,
});

export const shieldIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.text,
});
