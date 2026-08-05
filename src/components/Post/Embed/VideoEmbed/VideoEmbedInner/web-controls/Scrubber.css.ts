import { style } from '@vanilla-extract/css';

import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const root = style({
	boxSizing: 'border-box',
	flexShrink: 0,
	paddingInline: space.xs,
	width: '100%',
});

export const control = recipe(
	{
		base: {
			display: 'flex',
			alignItems: 'center',
			width: '100%',
			height: 18,
			touchAction: 'none',
			cursor: 'grab',
			userSelect: 'none',
			selectors: {
				'&[data-dragging]': { cursor: 'grabbing' },
			},
		},
		variants: {
			touch: {
				true: { height: 32 },
			},
		},
	},
	{ debugId: 'control' },
);

export const track = style({
	position: 'relative',
	borderRadius: borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.4)',
	width: '100%',
	height: 3,
	transition: 'height 0.1s ease',
	selectors: {
		[`${root}:hover &, ${root}[data-dragging] &`]: { height: 6 },
	},
});

export const indicator = style({
	borderRadius: borderRadius.full,
	backgroundColor: '#fff',
});

export const thumb = style({
	borderRadius: borderRadius.full,
	backgroundColor: '#fff',
	boxShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
	width: 16,
	height: 16,
	transition: 'scale 0.1s ease',
	scale: '0',
	selectors: {
		'&::after': {
			content: '""',
			position: 'absolute',
			inset: -8,
		},
		'&:has(:focus-visible)': { outline: '2px solid #fff', outlineOffset: 2 },
		[`${root}:hover &, &:has(:focus-visible)`]: { scale: '1' },
		[`${root}[data-dragging] &`]: { scale: '1.5' },
	},
});
