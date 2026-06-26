import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { zIndex } from '#/styles/tokens.css';

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
 * The popup card. The `size` variant caps width; `scroll: 'body'` switches from a padded card that grows with
 * its content (the surrounding viewport scrolls) into a height-bounded flex column whose own `Body`/`List`
 * child scrolls internally while the header/footer slots stay pinned (dropping the base card padding, which
 * the slots own). `fullHeight` locks a `body`-scroll popup to its max height so a transient loading/empty
 * state can't shrink it.
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
				narrow: { maxWidth: 400 },
			},
		},
		defaultVariants: { fullHeight: false, scroll: 'viewport', size: 'default' },
	},
	{ debugId: 'dialogPopup', layer: components },
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

export const close = style(
	layered(components, {
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
		height: 33,
		justifyContent: 'center',
		position: 'absolute',
		right: 12,
		top: 12,
		width: 33,
		zIndex: zIndex.dialog,
		selectors: {
			'&:hover': { backgroundColor: vars.palette.contrast_50 },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
		},
	}),
);

// declared after `close` so it wins by source order within the `components` layer: pins the button to the
// screen corner (outside the popup card) — for full-height dialogs whose close floats over the backdrop,
// like the GIF picker.
//
// the inner close animates for free as a child of the popup (which fades+scales). the outer close sits
// outside the popup, so it instead piggybacks on the viewport's transition: the viewport carries Base UI's
// `data-starting-style`/`data-ending-style` and stays mounted through the closing transition, so as its
// descendant the close can fade in/out off those attributes (matched to the popup's 200ms easing).
export const closeOuter = style(
	layered(components, {
		position: 'fixed',
		transitionDuration: '200ms',
		transitionProperty: 'opacity',
		transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
		zIndex: zIndex.menu,
		selectors: {
			[`${viewport}[data-starting-style] &, ${viewport}[data-ending-style] &`]: {
				opacity: 0,
			},
		},
	}),
);
