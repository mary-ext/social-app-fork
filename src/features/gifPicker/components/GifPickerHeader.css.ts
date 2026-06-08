import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

// spacing below the search field, before the category pills.
export const root = style({
	paddingBottom: space.md,
});

// the positioning context for the leading icon and trailing clear button. its height tracks the input (the
// only in-flow child) so `top: 50%` centers the adornments on the input rather than on the padded root.
export const field = style({
	position: 'relative',
});

// leading search icon, vertically centered and non-interactive so clicks fall through to the input. its
// color tracks the input's interaction state, mirroring the RNW TextField icon (accent on focus).
export const icon = style({
	alignItems: 'center',
	color: vars.palette.contrast_500,
	display: 'flex',
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

// leave room for the leading icon (always present); applied on top of the unlayered-winning component
// layer so it overrides the TextField input's symmetric inline padding.
export const input = style({
	paddingInlineStart: 40,
});

// extra trailing room for the clear button when it is shown.
export const inputWithClear = style({
	paddingInlineEnd: 44,
});

export const clear = style({
	insetInlineEnd: 6,
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
});
