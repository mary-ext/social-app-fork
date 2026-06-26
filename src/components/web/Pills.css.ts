import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';

/**
 * A wrapping flex row of moderation pills, spaced per `size`. Unlayered: the only escape hatch is a caller's
 * outer spacing `className`, rare enough not to warrant the `components`-layer override dance.
 */
export const row = recipe({
	base: {
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	variants: {
		size: {
			lg: { gap: 5 },
			sm: { gap: 3 },
		},
	},
	defaultVariants: { size: 'sm' },
});

/**
 * A single moderation pill: a borderless, fully-rounded flex row that highlights on hover/press. Its resting
 * tint is on by default; PostAlerts passes `noBg` for `sm` pills so they read transparent until hovered.
 */
export const pill = recipe({
	base: {
		alignItems: 'center',
		background: 'none',
		border: 'none',
		borderRadius: 999,
		boxSizing: 'border-box',
		color: vars.palette.contrast_700,
		cursor: 'pointer',
		display: 'flex',
		flexDirection: 'row',
		flexShrink: 0,
		maxWidth: '100%',
		minWidth: 0,
		selectors: {
			'&:active': { backgroundColor: vars.palette.contrast_50 },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			'&:hover': { backgroundColor: vars.palette.contrast_50 },
		},
	},
	variants: {
		bg: {
			false: {},
			true: { backgroundColor: vars.palette.contrast_25 },
		},
		size: {
			lg: { gap: 5, padding: 5 },
			sm: { gap: 3, padding: 3 },
		},
	},
	defaultVariants: { bg: true, size: 'sm' },
});

export const pillText = style({
	paddingRight: 3,
});
