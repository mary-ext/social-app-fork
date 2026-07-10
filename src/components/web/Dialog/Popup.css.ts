import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { space, zIndex } from '#/styles/tokens.css';

export const backdrop = style(
	layered(components, {
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		inset: 0,
		position: 'fixed',
		transitionDuration: '150ms',
		transitionProperty: 'opacity',
		zIndex: zIndex.dialog,
		selectors: {
			'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
		},
	}),
);

export const viewport = style(
	layered(components, {
		alignItems: 'flex-start',
		bottom: 0,
		boxSizing: 'border-box',
		display: 'flex',
		justifyContent: 'center',
		left: 0,
		overflowY: 'auto',
		// mobile-first: top-anchored with a small inset on narrow screens; past the 800px breakpoint the
		// vertical inset opens up to 10vh so the card floats lower on the screen.
		paddingBlock: 20,
		paddingInline: 20,
		position: 'fixed',
		right: 0,
		top: 0,
		zIndex: zIndex.dialog,
		'@media': {
			'(min-width: 800px)': {
				paddingBlock: '10vh',
			},
		},
	}),
);

/**
 * popup card.
 *
 * @param size variant that caps width
 * @param padding 'none' drops the card's own padding, for full-bleed content (media, per-section bands) that
 *   reapplies padding itself
 * @param scroll 'body' switches from a padded card that grows with content to a height-bounded flex column
 *   where the body scrolls internally and header/footer stay pinned
 * @param fullHeight locks a 'body'-scroll popup to its max height to prevent shrinking during loading/empty
 *   states
 */
export const popup = recipe(
	{
		base: {
			backgroundColor: vars.palette.contrast_0,
			border: `1px solid ${vars.palette.contrast_200}`,
			borderRadius: 12,
			boxShadow: vars.shadow.dialog,
			boxSizing: 'border-box',
			padding: 24,
			position: 'relative',
			transitionDuration: '200ms',
			transitionProperty: 'opacity, transform',
			transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
			width: '100%',
			selectors: {
				'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
			},
		},
		variants: {
			fullHeight: {
				true: { height: '80vh' },
			},
			// declared after `base` so `none` wins over the base padding by source order.
			padding: {
				default: {},
				none: { padding: 0 },
			},
			scroll: {
				// the `body` strategy (orthogonal to `size`): a height-bounded flex column whose own
				// `Body`/`List` child scrolls internally while the header/footer slots stay pinned. drops the base
				// card padding (the slots own their padding). declared after `base` so it wins by source order.
				body: {
					display: 'flex',
					flexDirection: 'column',
					maxHeight: '80vh',
					overflow: 'hidden',
					padding: 0,
				},
				viewport: {},
			},
			size: {
				default: { maxWidth: 600 },
				medium: { maxWidth: 460 },
				narrow: { maxWidth: 400 },
				wide: { maxWidth: 520 },
			},
		},
		defaultVariants: { fullHeight: false, padding: 'default', scroll: 'viewport', size: 'default' },
	},
	{ debugId: 'popup', layer: components },
);

/** Scrollable content region of a `body`-scroll popup (below a pinned header, above a pinned footer). */
export const body = style(
	layered(components, {
		flex: 1,
		minHeight: 0,
		overflowY: 'auto',
	}),
);

/** Pinned action bar at the bottom of a `body`-scroll popup. */
export const footer = style(
	layered(components, {
		backgroundColor: vars.palette.contrast_0,
		borderTop: `1px solid ${vars.palette.contrast_200}`,
		boxSizing: 'border-box',
		flexShrink: 0,
		paddingBlock: 12,
		paddingInline: 16,
	}),
);

export const titleRow = style(
	layered(components, {
		display: 'flex',
		flexDirection: 'row',
		gap: space.sm,
	}),
);

export const title = style(
	layered(components, {
		minWidth: 0,
		selectors: {
			[`${titleRow} &`]: {
				flexGrow: 1,
			},
		},
	}),
);

// action/button row. three orthogonal knobs: `direction` picks the axis (`row`, `column`, or `responsive` =
// column on narrow / row past 800px); `align` distributes the row (`end` clusters right, `center`, `between`
// spreads to the edges) and is inert in a column; `reverse` flips the flow so the last (primary) child leads
// — on `responsive` it flips only the narrow column phase, so the primary rises to the top on mobile.
export const actions = recipe(
	{
		base: {
			display: 'flex',
			gap: space.sm,
		},
		variants: {
			align: {
				between: {},
				center: {},
				end: {},
			},
			direction: {
				column: { flexDirection: 'column' },
				responsive: {
					flexDirection: 'column',
					'@media': {
						'(min-width: 800px)': { flexDirection: 'row' },
					},
				},
				row: { flexDirection: 'row' },
			},
			reverse: {
				false: {},
				true: {},
			},
		},
		compoundVariants: [
			// `reverse` flips the flow direction; on `responsive` only the narrow (column) phase flips, so the
			// wide row keeps its natural order while the primary still rises to the top when stacked.
			{ direction: 'column', reverse: true, style: { flexDirection: 'column-reverse' } },
			{ direction: 'row', reverse: true, style: { flexDirection: 'row-reverse' } },
			{
				direction: 'responsive',
				reverse: true,
				style: {
					flexDirection: 'column-reverse',
					'@media': {
						'(min-width: 800px)': { flexDirection: 'row' },
					},
				},
			},
			// `align` distributes the main axis of a row — for `responsive` only past the breakpoint, where it
			// becomes a row.
			{ align: 'between', direction: 'row', style: { justifyContent: 'space-between' } },
			{ align: 'center', direction: 'row', style: { justifyContent: 'center' } },
			{ align: 'end', direction: 'row', style: { justifyContent: 'flex-end' } },
			{
				align: 'between',
				direction: 'responsive',
				style: { '@media': { '(min-width: 800px)': { justifyContent: 'space-between' } } },
			},
			{
				align: 'center',
				direction: 'responsive',
				style: { '@media': { '(min-width: 800px)': { justifyContent: 'center' } } },
			},
			{
				align: 'end',
				direction: 'responsive',
				style: { '@media': { '(min-width: 800px)': { justifyContent: 'flex-end' } } },
			},
		],
		defaultVariants: { align: 'end', direction: 'row', reverse: false },
	},
	{ debugId: 'actions', layer: components },
);

export const divider = style(
	layered(components, {
		borderTop: `1px solid ${vars.palette.contrast_100}`,
		width: '100%',
	}),
);

/**
 * close (×) button.
 *
 * @param variant `default` is static/in-flow for a `TitleRow` (the negative margin tucks it toward the card
 *   corner); `floating` pins it over the popup's own content (media/no-header dialogs); `outer` pins it to
 *   the screen corner outside the card (full-height dialogs like the GIF picker)
 */
export const close = recipe(
	{
		// appearance only; positioning comes from the variants. `flex-shrink: 0` holds its size beside a
		// flexing title in a `TitleRow`.
		base: {
			alignItems: 'center',
			appearance: 'none',
			// solid surface bg: blends into a card, but reads as a circle over a backdrop (e.g. the GIF
			// picker's outer close).
			backgroundColor: vars.palette.contrast_0,
			border: 'none',
			borderRadius: 999,
			color: vars.palette.contrast_600,
			cursor: 'pointer',
			display: 'inline-flex',
			flexShrink: 0,
			height: 32,
			justifyContent: 'center',
			width: 32,
			selectors: {
				'&:hover': { backgroundColor: vars.palette.contrast_50 },
				'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			},
		},
		variants: {
			variant: {
				default: {
					margin: -8,
				},
				floating: {
					position: 'absolute',
					right: 12,
					top: 12,
					zIndex: zIndex.dialog,
				},
				outer: {
					position: 'fixed',
					right: 12,
					top: 12,
					transitionDuration: '200ms',
					transitionProperty: 'opacity',
					transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
					zIndex: zIndex.menu,
					selectors: {
						[`${viewport}[data-starting-style] &, ${viewport}[data-ending-style] &`]: { opacity: 0 },
					},
				},
			},
		},
		defaultVariants: { variant: 'default' },
	},
	{ debugId: 'close', layer: components },
);
