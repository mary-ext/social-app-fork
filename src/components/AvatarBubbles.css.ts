import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const containerSizeVar = createVar();
export const innerOffsetVar = createVar();
export const innerScaleVar = createVar();

export const outer = style({
	boxSizing: 'border-box',
	height: containerSizeVar,
	padding: 2,
	width: containerSizeVar,
});

// the layout coordinates are authored in a 120px space and scaled to the requested size; the absolute bubbles
// anchor to this box, so it must establish a positioning context.
export const inner = style({
	marginLeft: innerOffsetVar,
	marginTop: innerOffsetVar,
	position: 'relative',
	transform: `scale(${innerScaleVar})`,
	transformOrigin: 'top left',
});

export const bubbleXVar = createVar();
export const bubbleYVar = createVar();
export const bubbleScaleVar = createVar();
export const bubbleZIndexVar = createVar();
export const bubbleDelayVar = createVar();

export const bubble = style({
	position: 'absolute',
	transform: `translate(${bubbleXVar}, ${bubbleYVar}) scale(${bubbleScaleVar})`,
	zIndex: bubbleZIndexVar,
});

export const bubbleBorder = style({
	borderColor: vars.palette.contrast_0,
	borderRadius: '50%',
	borderStyle: 'solid',
	borderWidth: 2,
});

// entrance animation: an ease-out-back curve that overshoots the final scale, then settles.
export const bubbleAnimated = style({
	transitionDelay: bubbleDelayVar,
	transitionDuration: '250ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
});

export const placeholderSizeVar = createVar();

export const placeholder = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_200,
	borderRadius: '50%',
	boxSizing: 'border-box',
	color: vars.palette.contrast_0,
	display: 'flex',
	height: placeholderSizeVar,
	justifyContent: 'center',
	width: placeholderSizeVar,
});
