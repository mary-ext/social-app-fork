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
	// column-reverse anchors the scroll to the bottom (newest) for free: scrollTop 0 is the bottom,
	// appends stay pinned, and prepends keep their offset. the single `timeline` child preserves
	// natural top-to-bottom DOM order.
	display: 'flex',
	flexDirection: 'column-reverse',
	overflowY: 'scroll',
	// clip the MessageItem highlight flash, which bleeds past the row margins by design;
	// RN clips it natively, web would otherwise show a horizontal scrollbar.
	overflowX: 'hidden',
	scrollbarWidth: 'thin',
	scrollbarColor: `${vars.palette.contrast_100} transparent`,
	scrollbarGutter: 'stable',
});

export const timeline = style({
	display: 'flex',
	flexDirection: 'column',
});

export const loader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	height: 50,
});

export const inputWrap = style({
	position: 'sticky',
	bottom: 0,
	zIndex: 1,
});
