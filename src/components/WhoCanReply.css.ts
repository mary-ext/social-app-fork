import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { MOUSE, PRESSED } from '#/styles/interaction';
import { iconSize, space } from '#/styles/tokens.css';

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
	color: colors.textLink,
});

export const label = style({
	selectors: {
		[`${MOUSE} ${trigger}:hover &, ${trigger}:focus-visible &, ${trigger}${PRESSED} &`]: {
			textDecoration: 'underline',
		},
	},
});

export const gateIcon = style({
	width: 16,
	height: 16,
});

export const tinyChevronDownIcon = style({
	width: iconSize._2xs,
	height: iconSize._2xs,
});
