import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

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
	outline: 'none',
	padding: 0,
});

export const triggerAuthor = style({
	color: colors.primary_500,
});

export const label = style({
	selectors: {
		[`${trigger}:hover &, ${trigger}:focus-visible &`]: { textDecoration: 'underline' },
	},
});
