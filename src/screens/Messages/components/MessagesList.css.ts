import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const root = style({
	position: 'relative',
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minHeight: 0,
});

export const scroller = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'scroll',
	// clip the MessageItem highlight flash, which bleeds past the row margins by design;
	// RN clips it natively, web would otherwise show a horizontal scrollbar.
	overflowX: 'hidden',
	scrollbarWidth: 'thin',
	scrollbarColor: `${vars.palette.contrast_100} transparent`,
	scrollbarGutter: 'stable',
});

export const loader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	height: 50,
});

export const inputWrap = style({
	position: 'absolute',
	bottom: 0,
	left: 0,
	right: 0,
});
