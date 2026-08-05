import { style } from '@vanilla-extract/css';

import { borderRadius, space, zIndex } from '#/styles/tokens.css';

export const portal = style({ zIndex: zIndex.popover });

export const popup = style({
	transformOrigin: 'var(--transform-origin)',
	borderRadius: borderRadius.full,
	backgroundColor: 'rgba(0, 0, 0, 0.65)',
	backdropFilter: 'blur(12px)',
	paddingBlock: space.lg,
	paddingInline: space.sm,
	transition: 'opacity 0.15s ease, scale 0.15s ease',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { scale: '0.9', opacity: 0 },
	},
});

export const control = style({
	display: 'flex',
	justifyContent: 'center',
	width: 16,
	height: 88,
	touchAction: 'none',
	cursor: 'pointer',
	userSelect: 'none',
});

export const track = style({
	position: 'relative',
	borderRadius: borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.3)',
	width: 4,
	height: '100%',
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
	selectors: {
		'&::after': {
			content: '""',
			position: 'absolute',
			inset: -8,
		},
		'&:has(:focus-visible)': { outline: '2px solid #fff', outlineOffset: 2 },
		[`${control}[data-dragging] &`]: { scale: '1.5' },
	},
});
