import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const svg = style({
	display: 'block',
	flexShrink: 0,
	// don't clip the top-left bubble, which is authored slightly outside the viewBox.
	overflow: 'visible',
});

export const bubbleScaleVar = createVar();
export const bubbleDelayVar = createVar();

// fills the foreignObject, carries the entrance scale, and centers the avatar in the bordered slot.
export const bubble = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	height: '100%',
	justifyContent: 'center',
	transform: `scale(${bubbleScaleVar})`,
	transformOrigin: 'center',
	width: '100%',
});

export const bubbleBorder = style({
	borderColor: vars.palette.contrast_0,
	borderRadius: '50%',
	borderStyle: 'solid',
	borderWidth: 2,
});

// entrance animation with ease-out-back curve.
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
