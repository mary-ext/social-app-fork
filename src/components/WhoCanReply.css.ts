import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const trigger = style({
	appearance: 'none',
	display: 'inline-flex',
	gap: space.xs,
	alignItems: 'center',
	margin: 0,
	outline: 'none',
	border: 'none',
	background: 'none',
	padding: 0,
	color: colors.contrast_400,
	font: 'inherit',
	cursor: 'pointer',
});

export const triggerAuthor = style({
	color: colors.primary_500,
});

export const label = style({
	selectors: {
		[`${trigger}:hover &, ${trigger}:focus-visible &`]: { textDecoration: 'underline' },
	},
});
