import { globalStyle, style } from '@vanilla-extract/css';

import { MOUSE } from '#/styles/interaction';

import { POST_ACTIVE_ATTR, POST_HOVERED_ATTR, POST_INSTANT_ATTR, POST_OVERLAY_ATTR } from './elements';

/** on mouse devices, shows post overlay controls only while their post is hovered or active. */
export const revealOnHover = style({
	transition: 'opacity 100ms',
});

globalStyle(
	`${MOUSE} [${POST_OVERLAY_ATTR}]:not([${POST_HOVERED_ATTR}], [${POST_ACTIVE_ATTR}]) ${revealOnHover}`,
	{
		opacity: 0,
	},
);

// edits can reposition posts before their controls finish fading.
globalStyle(`[${POST_INSTANT_ATTR}] [${POST_OVERLAY_ATTR}] ${revealOnHover}`, {
	transition: 'none',
});
