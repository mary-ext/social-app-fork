import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const container = style({
	flex: 1,
	paddingBlock: '12px',
});

/** A single settings row: icon + flexible text + trailing badge/chevron. */
export const item = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: '8px',
	minHeight: '48px',
	paddingBlock: '8px',
	paddingInline: '20px',
	width: '100%',
});

/** Left-pads a row so its content aligns under the title text of sibling rows that carry an icon. */
export const itemIconInset = style({
	// inline padding (20) + icon (24) + gap (8)
	paddingLeft: '52px',
});

/**
 * Strips a row's own padding and min-height, for a compact control row nested in a {@link group} (which
 * supplies the horizontal padding and surrounding rhythm).
 */
export const itemFlush = style({
	minHeight: 0,
	paddingBlock: '0px',
	paddingInline: '0px',
});

/** Element reset + focus ring for a row that is itself an `<a>`/`<button>`/checkbox root. */
export const itemInteractive = style({
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	color: 'inherit',
	cursor: 'pointer',
	font: 'inherit',
	textAlign: 'left',
	textDecoration: 'none',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: '-2px' },
	},
});

/** Row-level hover tint, for navigational rows (links/pressables). Toggle rows omit this by design. */
export const itemHover = style({
	selectors: {
		'&:hover': { background: vars.palette.contrast_25 },
	},
});

/** The flexible label that fills a row, pushing trailing badges/chevrons to the end. */
export const itemText = style({
	flexGrow: 1,
	minWidth: 0,
	textAlign: 'left',
});

export const chevron = style({
	color: vars.palette.contrast_500,
	display: 'flex',
	flexShrink: 0,
});

export const group = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
	paddingBlock: '8px',
	paddingInline: '20px',
	width: '100%',
});

export const itemIcon = style({
	color: vars.palette.contrast_1000,
	display: 'flex',
	flexShrink: 0,
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	marginBlock: '8px',
	width: '100%',
});

/**
 * Negative tint for the icon/chevron of a `destructive` row. Declared after {@link itemIcon}/{@link chevron}
 * so it wins the cascade when both classes are applied.
 */
export const destructiveIcon = style({
	color: vars.palette.negative_500,
});

/** The 24×24 checkbox box for a {@link CheckboxItem}; reflects the nearest checkbox root's checked state. */
export const checkboxBox = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: '6px',
	boxSizing: 'border-box',
	color: vars.palette.white,
	display: 'flex',
	flexShrink: 0,
	height: '24px',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color',
	width: '24px',
	selectors: {
		// root-agnostic: matches whichever Base UI checkbox root (a settings row) wraps the box
		'[data-checked] &': {
			backgroundColor: vars.palette.primary_500,
			borderColor: vars.palette.primary_500,
		},
	},
});

export const checkboxIndicator = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
});
