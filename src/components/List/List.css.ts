import { style } from '@vanilla-extract/css';

import { recipe } from '#/styles/recipe';

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
