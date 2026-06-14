import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontSize, lineHeight, space } from '#/styles/tokens.css';

/**
 * The rendered height of a {@link label} title line — `Text`'s own `roundToPx(size × leading)` formula for
 * size `md` × snug leading. Matches it exactly (pixel snap included) so trailing content centers on the title
 * line rather than a fraction off it.
 */
const titleLineHeight = roundToPx(calc.multiply(fontSize.md, lineHeight.snug));

// #region layout
/** The scroll body: a stack of {@link section} cards with vertical rhythm between them. */
export const list = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xl,
	paddingBlock: space.lg,
	paddingInline: space.lg,
	width: '100%',
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
});

export const sectionHeader = style({
	paddingBottom: space.md,
});

export const sectionFootnote = style({
	paddingInline: space.xs,
	paddingTop: space.sm,
});

const cardRadius = 12;

/** The rounded surface that holds a section's rows; clips them to its corners and the hairline dividers. */
export const card = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: cardRadius,
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	width: '100%',
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	width: '100%',
});
// #endregion

// #region row
/**
 * A single row inside a {@link card}, laid out as a two-row grid:
 *
 *     icon | title    | trailing
 *          | subtitle (spans title + trailing)
 *
 * The title shares its line with the trailing control/value, while the subtitle flows full-width beneath both
 * — so a long title or value can't squeeze the subtitle into a narrow column. Content top-aligns so the
 * trailing control sits on the title line; symmetric block padding keeps a single-line row visually
 * centered.
 */
export const row = style({
	alignItems: 'start',
	boxSizing: 'border-box',
	columnGap: space.md,
	display: 'grid',
	gridTemplateColumns: 'auto minmax(0, 1fr) auto',
	paddingBlock: 14,
	paddingInline: space.lg,
	rowGap: space.xs,
	textAlign: 'left',
	width: '100%',
});

/**
 * Element reset + hover tint + focus ring for a row that is itself an `<a>`/`<button>`/switch/select trigger.
 * A disabled row (including one frozen mid-write via `loading`) greys out and drops its hover tint.
 */
export const rowInteractive = style({
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	color: 'inherit',
	cursor: 'pointer',
	font: 'inherit',
	textDecoration: 'none',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, opacity',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'&:hover:not(:disabled):not([data-disabled])': { backgroundColor: vars.palette.contrast_50 },
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
		'&:disabled, &[data-disabled]': {
			cursor: 'default',
			opacity: 0.5,
		},
	},
});

/**
 * Rounds a row's top corners to the card's radius. Applied to the first row so its hover tint and focus ring
 * follow the card corner instead of being clipped square by the card's `overflow: hidden`.
 */
export const rowFirst = style({
	borderTopLeftRadius: cardRadius,
	borderTopRightRadius: cardRadius,
});

/** Rounds a row's bottom corners to the card's radius; applied to the last row. */
export const rowLast = style({
	borderBottomLeftRadius: cardRadius,
	borderBottomRightRadius: cardRadius,
});

export const icon = style({
	color: vars.palette.contrast_500,
	display: 'flex',
	flexShrink: 0,
	gridColumn: 1,
	gridRow: 1,
});

/** The row's primary text, sharing its line with the trailing control. */
export const title = style({
	gridColumn: 2,
	gridRow: 1,
	minWidth: 0,
});

/** The row's muted second line; spans the title and trailing columns so it gets the full row width. */
export const subtitle = style({
	gridColumn: '2 / 4',
	gridRow: 2,
	minWidth: 0,
});

/** Wraps a trailing value next to its chevron so they stay together, centered on the title's line. */
export const trailing = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	gap: space.xs,
	gridColumn: 3,
	gridRow: 1,
	minHeight: titleLineHeight,
});

/** Clamps the trailing select value's width so a long label can't squeeze the title on narrow rows. */
export const value = style({
	maxWidth: 'min(220px, 45vw)',
});

export const chevron = style({
	color: vars.palette.contrast_500,
	display: 'flex',
	flexShrink: 0,
});
// #endregion

// #region switch
/** The pill track of the row's trailing switch; tints when the nearest switch root is checked. */
export const switchTrack = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_200,
	borderRadius: 999,
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	height: 20,
	padding: 4,
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	width: 32,
	selectors: {
		'[data-checked] &': { backgroundColor: vars.palette.primary_500 },
	},
});

export const switchThumb = style({
	backgroundColor: vars.palette.white,
	borderRadius: 999,
	height: 10,
	transitionDuration: '100ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
	width: 10,
	selectors: {
		'[data-checked] &': { transform: 'translateX(14px)' },
	},
});
// #endregion
