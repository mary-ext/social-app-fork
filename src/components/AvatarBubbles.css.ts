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
	boxSizing: 'border-box',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transform: `scale(${bubbleScaleVar})`,
	transformOrigin: 'center',
	width: '100%',
	height: '100%',
});

export const bubbleBorder = style({
	borderWidth: 2,
	borderStyle: 'solid',
	borderRadius: '50%',
	borderColor: vars.palette.contrast_0,
});

export const bubbleAnimated = style({
	transitionDelay: bubbleDelayVar,
	transitionDuration: '250ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
});

export const placeholderSizeVar = createVar();

export const placeholder = style({
	boxSizing: 'border-box',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: '50%',
	backgroundColor: vars.palette.contrast_200,
	width: placeholderSizeVar,
	height: placeholderSizeVar,
	color: vars.palette.contrast_0,
});
