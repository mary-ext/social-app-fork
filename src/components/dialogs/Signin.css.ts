import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize } from '#/styles/tokens.css';

export const error = style({
	marginTop: 4,
});

export const field = style({
	position: 'relative',
});

export const fieldIcon = style({
	width: iconSize.lg,
	height: iconSize.lg,
	color: colors.contrast_500,
	display: 'block',
	position: 'absolute',
	insetInlineStart: 12,
	top: '50%',
	transform: 'translateY(-50%)',
	pointerEvents: 'none',
});

export const fieldInput = style({
	paddingInlineStart: 40,
});
