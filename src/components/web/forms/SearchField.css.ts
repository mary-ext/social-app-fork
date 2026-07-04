import { style } from '@vanilla-extract/css';

import * as textField from '#/components/TextField.css';

import { vars } from '#/styles/contract.css';

// positioning context for the leading icon and trailing clear control overlaid on the input. its height
// tracks the input (the only in-flow child) so `top: 50%` centers the adornments on the input.
export const field = style({
	position: 'relative',
});

// leading search icon, vertically centered and non-interactive so clicks fall through to the input. its color
// tracks the input's interaction state (accent on focus).
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

// trailing clear button, vertically centered over the input's end edge.
export const clear = style({
	insetInlineEnd: 6,
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
});

// the field pill: reuses the shared TextField input visual, leaving room for the leading icon and — only while
// a trailing clear button is mounted (`:has`) — the clear button. the unlayered padding wins over TextField's
// symmetric inline padding, which sits in the `components` layer.
export const input = style([
	textField.input,
	{
		paddingInlineStart: 40,
		selectors: {
			[`${field}:has(${clear}) &`]: { paddingInlineEnd: 36 },
		},
	},
]);
