import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { iconSize } from '#/styles/tokens.css';

export const button = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 14,
	alignItems: 'center',
	marginTop: 1,
	border: 'none',
	borderRadius: 0,
	backgroundColor: vars.palette.contrast_0,
	padding: '12px 20px',
	width: '100%',
	textAlign: 'left',
	color: 'inherit',
	cursor: 'pointer',
	selectors: {
		[hover()]: { backgroundColor: vars.palette.contrast_50 },
	},
});

export const label = style({
	flex: 1,
	minWidth: 0,
});

export const arrowRotateCounterClockwiseIcon = style({
	width: iconSize.md,
	height: iconSize.md,
	color: colors.textContrastMedium,
});
