import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { iconSize } from '#/styles/tokens.css';

export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'center',
	marginTop: 8,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	padding: 12,
});

export const icon = style({
	width: iconSize.lg,
	height: iconSize.lg,
	color: colors.textContrastMedium,
	flexShrink: 0,
});

export const trailing = style({
	marginLeft: 'auto',
	flexShrink: 0,
});
