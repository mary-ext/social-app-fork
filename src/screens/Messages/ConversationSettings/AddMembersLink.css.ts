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
	gap: space.md,
	paddingBlock: space.sm,
	paddingInline: space.lg,
	textAlign: 'start',

	selectors: {
		'&:disabled': { cursor: 'default' },
		'&:focus-visible:not(:disabled)': {
			backgroundColor: colors.contrast_25,
			outline: `2px solid ${colors.primary_500}`,
			outlineOffset: -2,
		},
		'&:hover:not(:disabled)': { backgroundColor: colors.contrast_25 },
	},
});

export const content = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.md,
});

export const iconCircle = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_50,
	borderRadius: borderRadius.full,
	display: 'flex',
	flexShrink: 0,
	height: 40,
	justifyContent: 'center',
	width: 40,

	selectors: {
		[`${row}:focus-visible:not(:disabled) &`]: { backgroundColor: colors.contrast_100 },
		[`${row}:hover:not(:disabled) &`]: { backgroundColor: colors.contrast_100 },
	},
});
