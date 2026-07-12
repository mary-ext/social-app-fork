import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const row = style({
	alignItems: 'center',
	background: 'none',
	border: 'none',
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'space-between',
	outline: 'none',
	paddingBlock: space.sm,
	paddingInline: space.xl,
	textAlign: 'start',
	width: '100%',

	selectors: {
		'&:hover:not(:disabled)': { backgroundColor: colors.contrast_25 },
		'&:disabled': { cursor: 'default' },
	},
});

export const content = style({
	alignItems: 'center',
	display: 'flex',
});

export const iconCircle = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_50,
	borderRadius: borderRadius.full,
	display: 'flex',
	flexShrink: 0,
	height: 48,
	justifyContent: 'center',
	width: 48,

	selectors: {
		[`${row}:hover:not(:disabled) &`]: { backgroundColor: colors.contrast_100 },
	},
});

export const label = style({
	marginInline: space.sm,
});
