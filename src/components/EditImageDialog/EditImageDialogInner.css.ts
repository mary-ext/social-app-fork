import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
});

// square, like the alt text dialog's media pane, so the card's width is what sets the stage's height. it may
// shrink from there (`flex-shrink` against the card's max height) so a short window letterboxes the stage
// rather than scrolling the toolbar out of reach — which only starts below roughly 700px of window height.
export const viewport = style({
	flex: '0 1 auto',
	backgroundColor: vars.palette.contrast_25,
	aspectRatio: '1',
	width: '100%',
	minHeight: 0,
	cursor: 'grab',
	selectors: {
		'&[data-dragging]': { cursor: 'grabbing' },
	},
});

export const cropWindow = style({
	boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 0 9999px rgba(0, 0, 0, 0.55)',
	overflow: 'hidden',
});

export const roundCropWindow = style({
	borderRadius: '50%',
});

// rule-of-thirds guides, shown only while the image is being moved
export const grid = style({
	position: 'absolute',
	inset: 0,
	transition: 'opacity 150ms ease',
	opacity: 0,
	backgroundImage:
		'linear-gradient(currentColor 0 0), linear-gradient(currentColor 0 0), linear-gradient(currentColor 0 0), linear-gradient(currentColor 0 0)',
	backgroundPosition: '33.33% 0, 66.67% 0, 0 33.33%, 0 66.67%',
	backgroundSize: '1px 100%, 1px 100%, 100% 1px, 100% 1px',
	backgroundRepeat: 'no-repeat',
	color: 'rgba(255, 255, 255, 0.55)',
	selectors: {
		[`${viewport}[data-dragging] &, ${viewport}[data-pinching] &`]: { opacity: 1 },
	},
});
