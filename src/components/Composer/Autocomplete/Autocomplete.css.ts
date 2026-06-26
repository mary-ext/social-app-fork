import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize, space, zIndex } from '#/styles/tokens.css';

// the Positioner is the floating wrapper Base UI applies the computed transform to; it must sit on the
// menu tier so the suggestion popup clears the composer's own dialog.
export const positioner = style({
	zIndex: zIndex.menu,
});

export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	boxShadow: vars.shadow.lg,
	boxSizing: 'border-box',
	maxHeight: 'var(--available-height)',
	// a stable width so the list and the (otherwise tiny) loading spinner share one sensible size,
	// shrinking only when the viewport can't fit it.
	maxWidth: 'var(--available-width)',
	overflowX: 'hidden',
	overflowY: 'auto',
	paddingBlock: space.xs,
	width: 320,
});

// cloned from the search autocomplete's shared row so both pickers look identical: a left-to-right
// interactive row highlighted via Base UI's data attribute.
export const row = style({
	backgroundColor: 'transparent',
	boxSizing: 'border-box',
	color: vars.palette.contrast_1000,
	cursor: 'default',
	display: 'flex',
	gap: space.sm,
	outline: 'none',
	paddingBlock: 8,
	paddingInline: space.md,
	textAlign: 'start',
	userSelect: 'none',
	width: '100%',
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.contrast_25 },
	},
});

export const avatar = style({
	marginBlock: (40 - 36) / 2,
});

export const text = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const emojiGlyph = style({
	fontSize: fontSize.xl,
	lineHeight: 1.15,
});
