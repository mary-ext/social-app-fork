import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/Shell/Shell.css';

import { vars } from '#/styles/contract.css';
import { zIndex } from '#/styles/tokens.css';

export const outer = style({
	position: 'fixed',
	bottom: `calc(${fallbackVar(bottomBarHeightVar, '0px')} + 30px)`,
	left: 18,
	zIndex: zIndex.float,
});

export const leftInline = style({ left: 'calc(50vw - 282px)' });
export const leftOutOfLine = style({ left: 'calc(50vw - 382px)' });

export const button = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	alignItems: 'center',
	justifyContent: 'center',
	transition: 'transform 0.1s',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: 999,
	borderColor: vars.palette.contrast_100,
	backgroundColor: vars.palette.contrast_0,
	padding: 0,
	width: 42,
	height: 42,
	overflow: 'hidden',
	cursor: 'pointer',
	selectors: {
		'&:active': { transform: 'scale(0.9)' },
	},
});

export const indicator = style({
	backgroundColor: vars.palette.primary_50,
});

export const hover = style({
	position: 'absolute',
	inset: 0,
	transition: 'opacity 0.1s',
	opacity: 0,
	backgroundColor: vars.palette.contrast_50,
	pointerEvents: 'none',
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
