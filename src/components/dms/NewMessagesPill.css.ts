import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, zIndex } from '#/styles/tokens.css';

// the container spans the width but lets scroll events pass through — only the pill itself is
// interactive.
export const root = style({
	position: 'absolute',
	display: 'flex',
	alignItems: 'center',
	width: '100%',
	zIndex: zIndex.raised,
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
