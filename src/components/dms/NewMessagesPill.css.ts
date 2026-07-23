import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, space, zIndex } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	alignItems: 'center',
	zIndex: zIndex.raised,
	paddingBottom: space.md,
	paddingLeft: space.lg,
	pointerEvents: 'none',
});

export const button = style({
	appearance: 'none',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: 40,
	height: 40,
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.full,
	background: colors.bg,
	boxShadow: vars.shadow.sm,
	cursor: 'pointer',
	pointerEvents: 'auto',
});
