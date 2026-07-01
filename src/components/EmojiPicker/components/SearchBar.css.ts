import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontFamily, fontSize, space } from '#/styles/tokens.css';

import { SEARCH_INPUT_RADIUS } from '../layout';

// the band that insets the field off the panel edges.
export const row = style({
	paddingInline: space.sm,
	paddingTop: space.sm,
	zIndex: 1,
});

// positioning context for the leading icon and trailing accessory. its height tracks the input (the only
// in-flow child) so `top: 50%` centers the adornments on the input.
export const field = style({
	position: 'relative',
	marginBottom: -SEARCH_INPUT_RADIUS,
});

// leading search icon, vertically centered and non-interactive so clicks fall through to the input. its
// color tracks the input's interaction state (accent on focus).
export const icon = style({
	color: vars.palette.contrast_500,
	insetInlineStart: 12,
	pointerEvents: 'none',
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
	selectors: {
		[`${field}:hover &`]: { color: vars.palette.contrast_800 },
		[`${field}:has(input:focus) &`]: { color: vars.palette.primary_500 },
	},
});

export const input = style({
	appearance: 'none',
	backgroundColor: vars.palette.contrast_50,
	border: '1px solid transparent',
	borderRadius: SEARCH_INPUT_RADIUS,
	boxSizing: 'border-box',
	color: vars.palette.contrast_1000,
	display: 'block',
	fontFamily,
	fontSize: fontSize.md,
	lineHeight: 1.2,
	margin: 0,
	outline: 'none',
	// leave room for the leading icon (always present).
	paddingBlock: 12,
	paddingInline: 15,
	paddingInlineStart: 40,
	width: '100%',
	selectors: {
		'&::placeholder': { color: vars.palette.contrast_500, userSelect: 'none' },
		'&:hover': { borderColor: vars.palette.contrast_100 },
		'&:focus': { backgroundColor: vars.palette.primary_25, borderColor: vars.palette.primary_500 },
	},
});

// trailing room for the overlaid controls: the clear button plus the persistent accessory slot.
export const inputWithAccessory = style({
	paddingInlineEnd: 70,
});

// the trailing controls, overlaid inside the field at its trailing edge: the clear button (mounted only while
// the query is non-empty) followed by the persistent accessory slot (e.g. the skin-tone selector).
export const accessory = style({
	alignItems: 'center',
	display: 'flex',
	gap: 4,
	insetInlineEnd: 6,
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
});
