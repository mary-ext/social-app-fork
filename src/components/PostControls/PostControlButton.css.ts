import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

/**
 * Shared chrome for the post-control action buttons (reply/repost/like/bookmark/share/overflow): a
 * borderless, pill-shaped ghost button. The base text color is the resting tint; an active button paints its
 * own color via an inline `style` so icon + count inherit it through `currentColor`.
 */
export const button = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: 'transparent',
	border: 'none',
	borderRadius: 999,
	color: vars.palette.contrast_500,
	cursor: 'pointer',
	display: 'inline-flex',
	fontFamily: 'inherit',
	gap: 4,
	margin: 0,
	padding: 5,
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'&:hover:not(:disabled)': { backgroundColor: vars.palette.contrast_25 },
		'&:disabled': { cursor: 'default', opacity: 0.6 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

/**
 * Overrides for the count/label, which renders through the web {@link Text} primitive (for its device-snapped
 * snug line-height — a raw span's `line-height: normal` sits ~1px short of it). `inherit` lets the count pick
 * up the button's resting/active color via `currentColor`; the count never wraps.
 */
export const text = style({
	color: 'inherit',
	whiteSpace: 'nowrap',
});
