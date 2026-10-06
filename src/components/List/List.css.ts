import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';

import { ITEM_ATTRIBUTE } from './keyboard-navigation';

export const container = recipe(
	{
		base: {
			position: 'relative',
		},
		variants: {
			virtualized: {
				true: {
					overflowAnchor: 'none',
				},
			},
		},
	},
	{ debugId: 'container' },
);

export const virtualizer = style({
	contain: 'layout style',
});

export const row = style({
	display: 'flex',
	contain: 'content',
	flexDirection: 'column',
	flexShrink: 0,
});

globalStyle(`${row} [${ITEM_ATTRIBUTE}]:focus-visible`, {
	outline: `2px solid ${vars.palette.primary_500}`,
	outlineOffset: -2,
});

export const spacer = style({
	flexShrink: 0,
	pointerEvents: 'none',
});

export const aboveTheFold = style({
	position: 'absolute',
	insetInline: 0,
	top: 0,
	zIndex: -1,
	pointerEvents: 'none',
});

export const sentinel = style({
	zIndex: -1,
	pointerEvents: 'none',
});
