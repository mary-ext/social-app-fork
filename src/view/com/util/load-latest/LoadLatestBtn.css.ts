import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/web/Shell/Shell.css';

import { vars } from '#/styles/contract.css';
import { zIndex } from '#/styles/tokens.css';

export const outer = style({
	// sit clear of the bottom bar — its measured height already carries the safe-area inset — and rest the
	// same distance from the viewport bottom once the bar gives way to the side rails.
	bottom: `calc(${fallbackVar(bottomBarHeightVar, '0px')} + 30px)`,
	left: 18,
	position: 'fixed',
	zIndex: zIndex.stickyRaised,
});

// move the button inline with the feed column once it would otherwise overlap the left nav.
export const leftInline = style({ left: 'calc(50vw - 282px)' });
export const leftOutOfLine = style({ left: 'calc(50vw - 382px)' });

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
