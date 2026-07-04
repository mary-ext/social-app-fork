import { globalStyle, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

// the narrow (phone-width) card is a fixed-width snap target in a horizontal scroller; at >=800px the cards
// flow into a wrapping grid ~3 per row.
const MOBILE_CARD_WIDTH = 165;
const FINAL_CARD_WIDTH = 120;
const GRID_GAP = space.md;
const WIDE = 'screen and (min-width: 800px)';

/**
 * Tinted section wrapper; the top divider is dropped in the profile-header context (it sits under its own
 * chrome).
 */
export const section = recipe(
	{
		base: {
			backgroundColor: colors.contrast_25,
		},
		defaultVariants: { topBorder: true },
		variants: {
			topBorder: {
				true: {
					borderTopColor: colors.borderContrastLow,
					borderTopStyle: 'solid',
					borderTopWidth: 1,
				},
			},
		},
	},
	{ debugId: 'section' },
);

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	paddingInline: space.lg,
	paddingTop: space.md,
});

// a chromeless button so the "see more" opener reads as an inline text link; the underline lives on the label
// (`seeMoreText`) so it tracks the label's primary color.
export const seeMoreTrigger = style({
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	font: 'inherit',
	padding: 0,
});

export const seeMoreText = style({
	selectors: {
		[`${seeMoreTrigger}:hover &`]: { textDecoration: 'underline' },
	},
});

// the cards' shared container: a horizontal snap scroller on phones, a wrapping grid at >=800px.
export const grid = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: GRID_GAP,
	overflowX: 'auto',
	padding: space.lg,
	paddingTop: space.md,
	// align snapped cards to the inset, not the scrollport edge — without it `mandatory` snapping rests the
	// first card flush against the edge and eats the left gutter.
	scrollPaddingInline: space.lg,
	scrollSnapType: 'x mandatory',
	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
	'@media': {
		[WIDE]: {
			flexWrap: 'wrap',
			overflowX: 'visible',
			scrollSnapType: 'none',
		},
	},
});

// the wide grid is a single row of three; the phone scroller shows the full slice (and the trailing see-more
// card). later children collapse away above the breakpoint so the wrap can't spill onto a second row.
globalStyle(`${grid} > *:nth-child(n+4)`, {
	'@media': {
		[WIDE]: { display: 'none' },
	},
});

// the card box: a fixed-width snap target on phones, a grow-to-fill ~30% grid cell at >=800px. `align-items`
// defaults to `stretch` on the grid, so cards share a row's height and the follow button (after a
// margin-bottom:auto body) pins to the bottom.
export const cardBase = style({
	backgroundColor: colors.bg,
	borderColor: colors.borderContrastLow,
	borderRadius: borderRadius.lg,
	borderStyle: 'solid',
	borderWidth: 1,
	boxShadow: vars.shadow.sm,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	gap: space.xs,
	// without it the wide grid's flex items refuse to shrink below their content (a long bio word), so cards
	// with longer bios steal width and the row reads non-uniform. RN flex items default to this; CSS doesn't.
	minWidth: 0,
	padding: space.md,
	position: 'relative',
	scrollSnapAlign: 'start',
	width: MOBILE_CARD_WIDTH,
	'@media': {
		[WIDE]: {
			flexBasis: `calc(30% - ${GRID_GAP / 2}px)`,
			flexGrow: 1,
			width: 'auto',
		},
	},
});

// the interactive card is also the profile link (a `BlockLink` clones its class onto a `role=link` element).
export const cardLink = style({
	color: 'inherit',
	cursor: 'pointer',
	textDecoration: 'none',
	selectors: {
		'&:hover, &:active': { borderColor: colors.borderContrastHigh },
	},
});

// a chromeless icon button (just the glyph, tinting on hover) inset in the top-right corner; no circular
// background, matching the bare dismiss control.
export const dismiss = style({
	alignItems: 'center',
	background: 'none',
	border: 'none',
	color: colors.textContrastMedium,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	padding: space.xs,
	position: 'absolute',
	right: space.sm,
	top: space.sm,
	// over the card body; the follow button sits at the opposite (bottom) edge so a stacking context isn't needed
	zIndex: 1,
	selectors: {
		'&:hover': { color: colors.text },
	},
});

export const body = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	marginBottom: 'auto',
	paddingBottom: space.sm,
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	maxWidth: '100%',
});

export const badges = style({
	flexShrink: 0,
	paddingLeft: space.xs,

	':empty': {
		display: 'none',
	},
});

// spans the full card width (`align-self: stretch`) so its children have a width to resolve against, while
// staying a centered column for the name; the bio fills that width via `description` to wrap in-card.
export const identity = style({
	alignItems: 'center',
	alignSelf: 'stretch',
	display: 'flex',
	flexDirection: 'column',
	// the web `ProfileCard.Description` carries no top padding (the RNW one did), so the gap sets the name↔bio rhythm
	gap: space.xs,
});

// fills the card width so the bio wraps in-card (the centered column would otherwise shrink it to its content
// and let a long bio overflow); also the loading bars' track.
export const description = style({
	width: '100%',
});

export const followPlaceholder = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.sm,
	height: 33,
	width: '100%',
});

// the trailing "see more" card, shown only in the phone scroller (the grid offers the header link instead).
export const seeMoreCard = style({
	alignItems: 'center',
	background: 'none',
	border: 'none',
	color: colors.text,
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	gap: space.sm,
	justifyContent: 'center',
	padding: space.md,
	scrollSnapAlign: 'start',
	width: FINAL_CARD_WIDTH,
	'@media': {
		[WIDE]: { display: 'none' },
	},
});
