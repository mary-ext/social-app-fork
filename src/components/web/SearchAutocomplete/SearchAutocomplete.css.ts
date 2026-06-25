import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, fontFamily, fontSize, space, zIndex } from '#/styles/tokens.css';

// #region input field

// positioning context for the leading icon and trailing clear button overlaid on the input.
export const field = style({
	position: 'relative',
});

// leading search icon, vertically centered and click-through so the input takes the click.
export const icon = style({
	color: vars.palette.contrast_500,
	insetInlineStart: 12,
	pointerEvents: 'none',
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
	selectors: {
		[`${field}:has(input:focus) &`]: { color: vars.palette.primary_500 },
	},
});

export const input = style({
	appearance: 'none',
	backgroundColor: vars.palette.contrast_50,
	border: '1px solid transparent',
	borderRadius: 10,
	boxSizing: 'border-box',
	color: vars.palette.contrast_1000,
	display: 'block',
	fontFamily,
	fontSize: fontSize.md,
	lineHeight: 1.2,
	margin: 0,
	outline: 'none',
	paddingBlock: 10,
	// room for the leading icon and the trailing clear button.
	paddingInline: 40,
	width: '100%',
	selectors: {
		'&::placeholder': { color: vars.palette.contrast_500, userSelect: 'none' },
		'&:hover': { borderColor: vars.palette.contrast_100 },
		'&:focus': { backgroundColor: vars.palette.primary_25, borderColor: vars.palette.primary_500 },
	},
});

export const clear = style({
	alignItems: 'center',
	display: 'flex',
	insetInlineEnd: 6,
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
});

// #endregion

// #region popup

export const positioner = style({
	// don't shrink below a comfortable calendar width on a narrow rail; cap at the viewport when wider.
	maxWidth: 'var(--available-width)',
	minWidth: 300,
	width: 'var(--anchor-width)',
	zIndex: zIndex.menu,
});

export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.lg,
	boxSizing: 'border-box',
	maxHeight: 'min(70vh, var(--available-height))',
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	width: '100%',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
	},
});

export const list = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBlock: space.xs,
});

// #endregion
