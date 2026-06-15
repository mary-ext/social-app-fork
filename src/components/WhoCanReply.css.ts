import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

/** The inline icon+label control opening the who-can-reply dialog. Its `color` feeds the icons' currentColor. */
export const trigger = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'none',
	border: 'none',
	color: colors.contrast_400,
	cursor: 'pointer',
	display: 'inline-flex',
	font: 'inherit',
	gap: space.xs,
	margin: 0,
	// keyboard focus is signalled by the label underline below, not a focus ring.
	outline: 'none',
	padding: 0,
});

/** Thread-author variant: the whole control (icon, label, chevron) reads in the primary accent. */
export const triggerAuthor = style({
	color: colors.primary_500,
});

export const label = style({
	selectors: {
		[`${trigger}:hover &, ${trigger}:focus-visible &`]: { textDecoration: 'underline' },
	},
});

export const dialogContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});
