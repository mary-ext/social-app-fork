import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const button = style({
	textAlign: 'left',
	backgroundColor: colors.bg,
	border: `1px solid ${colors.contrast_100}`,
	borderRadius: borderRadius.full,
	gap: space.sm,
	justifyContent: 'space-between',
	paddingBlock: space.sm,
	paddingInlineEnd: space.sm,
	paddingInlineStart: space.lg,
	width: '100%',
});

export const editLabel = style({
	backgroundColor: colors.contrast_50,
	borderRadius: borderRadius.full,
	paddingBlock: 6,
	paddingInline: 10,
});
