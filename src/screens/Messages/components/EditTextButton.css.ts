import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const button = style({
	gap: space.sm,
	justifyContent: 'space-between',
	border: `1px solid ${colors.contrast_100}`,
	borderRadius: borderRadius.full,
	backgroundColor: colors.bg,
	paddingBlock: space.sm,
	paddingInlineStart: space.lg,
	paddingInlineEnd: space.sm,
	width: '100%',
	textAlign: 'left',
});

export const editLabel = style({
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_50,
	paddingBlock: 6,
	paddingInline: 10,
});
