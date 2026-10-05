import { globalStyle, style } from '@vanilla-extract/css';

import { MOUSE } from '#/styles/interaction';

import { POST_ACTIVE_ATTR, POST_ELEMENT } from './elements';

/** on mouse devices, shows controls only while their post is hovered or active. */
export const revealOnHover = style({
	transition: 'opacity 100ms',
});

globalStyle(`${MOUSE} ${POST_ELEMENT}:not(:hover) ${revealOnHover}`, {
	opacity: 0,
});

globalStyle(`${MOUSE} ${POST_ELEMENT}[${POST_ACTIVE_ATTR}] ${revealOnHover}`, {
	opacity: 1,
});
