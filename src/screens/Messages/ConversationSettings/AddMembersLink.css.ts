import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.md,
	alignItems: 'center',
	justifyContent: 'space-between',
	outline: 'none',
	border: 'none',
	background: 'none',
	paddingBlock: space.sm,
	paddingInline: space.lg,
	textAlign: 'start',
	cursor: 'pointer',

	selectors: {
		'&:disabled': { cursor: 'default' },
		'&:focus-visible:not(:disabled)': {
			outline: `2px solid ${colors.primary_500}`,
			outlineOffset: -2,
			backgroundColor: colors.contrast_25,
		},
		'&:hover:not(:disabled)': { backgroundColor: colors.contrast_25 },
	},
});

export const content = style({
	display: 'flex',
	gap: space.md,
	alignItems: 'center',
});

export const iconCircle = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_50,
	width: 40,
	height: 40,

	selectors: {
		[`${row}:focus-visible:not(:disabled) &`]: { backgroundColor: colors.contrast_100 },
		[`${row}:hover:not(:disabled) &`]: { backgroundColor: colors.contrast_100 },
	},
});
