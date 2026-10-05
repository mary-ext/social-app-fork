import { style } from '@vanilla-extract/css';

import { fontLeading, fontSize, space } from '#/styles/tokens.css';

import { RIGHT_PADDING } from '../shared/layout';
import { overlayIcon } from '../shared/overlay.css';
import { revealOnHover } from '../shared/reveal.css';

export const root = style({
	display: 'flex',
	paddingBottom: space._2xs,
	paddingRight: RIGHT_PADDING,
	// reserve space to avoid a layout shift when the profile loads.
	minHeight: `calc(${fontSize.md} * ${fontLeading.md})`,
	alignItems: 'center',
});

export const badges = style({
	paddingLeft: 6,
});

export const number = style({
	display: 'flex',
	flexShrink: 0,
	paddingInlineStart: space.sm,
});

// overhang the header so the button doesn't grow it.
export const remove = style([
	revealOnHover,
	{
		flexShrink: 0,
		marginBlock: -space.sm,
		marginInlineStart: 'auto',
		marginInlineEnd: -space.xs,
	},
]);

export const removeIcon = style([overlayIcon]);
