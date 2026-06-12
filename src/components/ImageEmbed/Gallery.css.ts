import { style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

/** Measurement host: its width/offset within the bleed ancestor drive the overflow inset. Height is inline. */
export const root = style({
	overflow: 'visible',
	width: '100%',
});

/** The horizontal scroll viewport. Width / margin / padding are inline (depend on the measured bleed). */
export const scroll = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: ITEM_GAP,
	height: '100%',
	// prevent horizontal trackpad/wheel swipes from triggering the browser's back/forward
	// overscroll-navigation gesture. handles chrome and firefox; safari ignores this and is handled
	// via the wheel listener in carousel/usePointerHandlers.ts
	overscrollBehaviorX: 'contain',
	overflowX: 'scroll',
	overflowY: 'hidden',
	position: 'relative',
	// hide the scrollbar (paging is gesture/keyboard driven)
	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});

export const item = style({
	appearance: 'none',
	background: vars.palette.contrast_25,
	border: 0,
	borderRadius: borderRadius.md,
	// inherit the viewport's grab cursor instead of the button pointer
	cursor: 'inherit',
	display: 'block',
	flex: '0 0 auto',
	margin: 0,
	outline: 0,
	overflow: 'hidden',
	padding: 0,
	position: 'relative',
	transitionDuration: '200ms',
	transitionProperty: 'transform',
	selectors: {
		'&:active': { transform: 'scale(0.99)' },
	},
});

export const image = style({
	display: 'block',
	objectFit: 'cover',
});
