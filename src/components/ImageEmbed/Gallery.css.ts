import { style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

/** Measurement host: its width/offset within the bleed ancestor drive the overflow inset. Height is inline. */
export const root = style({
	overflow: 'visible',
	width: '100%',
});

/** The horizontal scroll viewport. Margin / padding are inline (they depend on the measured bleed). */
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

export const item = style([
	mediaBorder,
	{
		appearance: 'none',
		background: vars.palette.contrast_25,
		borderRadius: borderRadius.md,
		// inherit the viewport's grab cursor instead of the button pointer
		cursor: 'inherit',
		display: 'block',
		flex: '0 0 auto',
		margin: 0,
		overflow: 'hidden',
		padding: 0,
		position: 'relative',
		transitionDuration: '200ms',
		transitionProperty: 'transform',
		selectors: {
			'&:active': { transform: 'scale(0.99)' },
			// inset so the ring sits 1px in from the hairline border this element carries, concentric with the
			// rounded corners and inside the carousel's overflow clip.
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	},
]);

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

/**
 * letterbox variant for ratio-unknown tiles. sizes the tile to a blind square and uses contain to show the
 * whole image instead of cover-cropping.
 */
export const imageContain = style({ objectFit: 'contain' });

export const loading = style({ opacity: 0 });

export const fallback = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	color: vars.palette.contrast_400,
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
});
