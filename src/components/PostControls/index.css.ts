import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

/** The compact action bar: the reply/repost/like cluster leading, share trailing. */
export const root = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	justifyContent: 'space-between',
	paddingTop: 12,
});

/** Holds the three primary controls and caps their spread so wide rows don't fling them apart. */
export const primaryGroup = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
});

/** One of the three equal-width primary slots, its button pinned to the leading edge. */
export const primaryItem = style({
	alignItems: 'flex-start',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
});

/** Dims the reply slot when the viewer can't reply. */
export const replyDisabled = style({ opacity: 0.6 });

/** The trailing share control. */
export const secondaryGroup = style({
	display: 'flex',
	gap: 16,
	flexDirection: 'row',
	justifyContent: 'flex-end',
});

/**
 * compact action button chrome. a borderless, transparent ghost button whose icon sits in a hover-highlighted
 * {@link iconCircle}. the base text color is the resting tint; an active button paints its own color via an
 * inline style so the icon and count inherit it through currentColor. only the circle takes the hover or
 * focus chrome.
 */
export const button = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: 'transparent',
	border: 'none',
	color: vars.palette.contrast_500,
	cursor: 'pointer',
	display: 'inline-flex',
	fontFamily: 'inherit',
	gap: 4,
	padding: 0,
	transitionDuration: '100ms',
	transitionProperty: 'color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		// the icon circle shows the focus ring on the button's behalf
		'&:focus-visible': { outline: 'none' },
		'&:disabled': { cursor: 'default', opacity: 0.6 },
	},
});

export const ICON_SIZE = 18;
export const ICON_CIRCLE_SIZE = 32;

/** The hover/focus target behind the icon; only the circle takes the highlight, never the count beside it. */
export const iconCircle = style({
	alignItems: 'center',
	borderRadius: 999,
	display: 'inline-flex',
	flexShrink: 0,
	height: ICON_CIRCLE_SIZE,
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	width: ICON_CIRCLE_SIZE,
	margin: ((ICON_CIRCLE_SIZE - ICON_SIZE) / 2) * -1,
	selectors: {
		[`${button}:hover:not(:disabled) &`]: { backgroundColor: vars.palette.contrast_50 },
		[`${button}:focus-visible &`]: {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

/**
 * overrides for the count/label, which renders through the web `Text` primitive. `inherit` lets the count
 * pick up the button's resting/active color via `currentColor`. the count never wraps.
 */
export const text = style({
	color: 'inherit',
	whiteSpace: 'nowrap',
});
