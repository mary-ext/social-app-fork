import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import { CENTER_COLUMN_OFFSET, CENTER_COLUMN_WIDTH, SCROLLBAR_OFFSET } from '#/components/web/Layout/const';

/** Discrete tablet-breakpoint column shift, toggled by the `columnOffset` class. */
const columnOffsetVar = createVar();

const scrollbarShift = `translateX(${SCROLLBAR_OFFSET})`;

export const screen = style({
	minHeight: '100dvh',
	paddingTop: 'env(safe-area-inset-top, 0px)',
});

export const screenNoInset = style({
	paddingTop: 0,
});

export const content = style({
	width: '100%',
});

export const center = style({
	boxSizing: 'border-box',
	marginInline: 'auto',
	maxWidth: `${CENTER_COLUMN_WIDTH}px`,
	transform: `translateX(${columnOffsetVar}) ${scrollbarShift}`,
	vars: { [columnOffsetVar]: '0px' },
	width: '100%',
});

/** Already inside an offset view — don't double-apply the centering transform. */
export const centerNested = style({
	transform: 'none',
});

export const webBorders = style({
	borderLeft: `1px solid ${vars.palette.contrast_100}`,
	borderRight: `1px solid ${vars.palette.contrast_100}`,
	bottom: 0,
	left: '50%',
	position: 'fixed',
	top: 0,
	transform: `translateX(-50%) translateX(${columnOffsetVar}) ${scrollbarShift}`,
	vars: { [columnOffsetVar]: '0px' },
	width: '602px',
});

// defined last so it wins the cascade over the base `0px` on `center` / `webBorders`.
export const columnOffset = style({
	vars: { [columnOffsetVar]: `${CENTER_COLUMN_OFFSET}px` },
});
