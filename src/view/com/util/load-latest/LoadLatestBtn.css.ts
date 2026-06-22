import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { zIndex } from '#/styles/tokens.css';

/** Distance from the viewport bottom, wired inline since it derives from the safe-area inset. */
export const bottomVar = createVar();

export const outer = style({
	bottom: bottomVar,
	left: 18,
	position: 'fixed',
	transition: 'transform 0.1s',
	zIndex: zIndex.stickyRaised,
});

// move the button inline with the feed column once it would otherwise overlap the left nav.
export const leftInline = style({ left: 'calc(50vw - 282px)' });
export const leftOutOfLine = style({ left: 'calc(50vw - 382px)' });

// lift above the bottom bar when it is shown (mobile, or tablet without a session).
export const lifted = style({ transform: 'translateY(-44px)' });

export const button = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.palette.contrast_0,
	borderColor: vars.palette.contrast_100,
	borderRadius: 999,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	height: 42,
	justifyContent: 'center',
	overflow: 'hidden',
	padding: 0,
	position: 'relative',
	transition: 'transform 0.1s',
	width: 42,
	selectors: {
		'&:active': { transform: 'scale(0.9)' },
	},
});

export const indicator = style({
	backgroundColor: vars.palette.primary_50,
});

export const hover = style({
	backgroundColor: vars.palette.contrast_50,
	inset: 0,
	opacity: 0,
	pointerEvents: 'none',
	position: 'absolute',
	transition: 'opacity 0.1s',
	willChange: 'opacity',
	selectors: {
		[`${button}:hover &`]: { opacity: 0.5 },
		[`.theme--dim ${button}:hover &`]: { opacity: 0.45 },
		[`.theme--dark ${button}:hover &`]: { opacity: 0.4 },
	},
});

export const icon = style({
	position: 'relative',
	zIndex: 10,
});
