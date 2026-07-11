import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const svg = style({
	display: 'block',
	flexShrink: 0,
	overflow: 'visible',
});

export const bubbleScaleVar = createVar();
export const bubbleDelayVar = createVar();

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
