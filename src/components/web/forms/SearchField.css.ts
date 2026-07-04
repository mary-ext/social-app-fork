import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize } from '#/styles/tokens.css';

// the field pill: a flex row holding a leading icon, the input, and any trailing controls (a clear button
// and/or a `slot`). it carries the pill visual the input used to own, so adornments sit inside the box as
// flex siblings rather than absolutely overlaid, and each keeps its own hit area. block padding lives on the
// input (not here) so the input — the tallest child — sets the pill height; the shorter trailing buttons stay
// centered and can't stretch it.
export const field = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	border: '1px solid transparent',
	borderRadius: 10,
	boxSizing: 'border-box',
	cursor: 'text',
	display: 'flex',
	// field padding (12) + the lg icon (20) + this gap lands the input text at 40, matching the original inset.
	gap: 8,
	paddingInline: 12,
	width: '100%',
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_100 },
		'&:has(input:focus)': { backgroundColor: vars.palette.primary_25, borderColor: vars.palette.primary_500 },
	},
});

// leading search icon, non-interactive so clicks fall through to the field's click-to-focus. its color tracks
// the input's interaction state (accent on focus).
export const icon = style({
	color: vars.palette.contrast_500,
	flexShrink: 0,
	pointerEvents: 'none',
	selectors: {
		[`${field}:hover &`]: { color: vars.palette.contrast_800 },
		[`${field}:has(input:focus) &`]: { color: vars.palette.primary_500 },
	},
});

// the text input: a transparent, chrome-less flex child (the pill lives on the field). `minWidth: 0` lets it
// shrink past its content so a long value or placeholder can't push the trailing controls out of the box.
export const input = style({
	appearance: 'none',
	backgroundColor: 'transparent',
	border: 'none',
	color: vars.palette.contrast_1000,
	flex: 1,
	fontFamily: 'inherit',
	fontSize: fontSize.md,
	// the paired leading for `md` (20px line ÷ 14px), pixel-snapped — matching how the `Text` recipe derives
	// line-height — instead of an arbitrary ratio.
	lineHeight: roundToPx(`calc(${fontSize.md} * ${fontLeading.md})`),
	margin: 0,
	minWidth: 0,
	outline: 'none',
	paddingBlock: 10,
	paddingInline: 0,
	selectors: {
		'&::placeholder': { color: vars.palette.contrast_500, userSelect: 'none' },
	},
});

// trailing clear button; kept from shrinking so it stays a full circle.
export const clear = style({
	flexShrink: 0,
	selectors: {
		// tuck a standalone clear out of the field's 12px inline padding to a 6px inset, matching the leading
		// icon. only when it's the field's own trailing control — inside a `slot` the slot does the tucking.
		[`${field} > &`]: { marginInlineEnd: -6 },
	},
});

// trailing container for several controls at once (e.g. a clear button beside a persistent accessory). pulled
// out to a 6px inset like `clear`, since it stands in as the trailing group.
export const slot = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	gap: 4,
	marginInlineEnd: -6,
});
