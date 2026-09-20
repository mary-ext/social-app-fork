import { style } from '@vanilla-extract/css';

import { fontLeading, fontSize, space } from '#/styles/tokens.css';

import { RIGHT_PADDING } from '../layout';

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
	marginInlineStart: 'auto',
	paddingInlineStart: space.sm,
});
