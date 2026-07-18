import { style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

export const root = style({
	width: '100%',
	overflow: 'visible',
});

export const scroll = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flexDirection: 'row',
	gap: ITEM_GAP,
	height: '100%',
	overflowX: 'scroll',
	overflowY: 'hidden',
	overscrollBehaviorX: 'contain',
	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});

export const item = style([
	mediaBorder,
	{
		appearance: 'none',
		display: 'block',
		position: 'relative',
		flex: '0 0 auto',
		transitionDuration: '200ms',
		transitionProperty: 'transform',
		margin: 0,
		borderRadius: borderRadius.md,
		background: vars.palette.contrast_25,
		padding: 0,
		overflow: 'hidden',
		cursor: 'inherit',
		selectors: {
			'&:active': { transform: 'scale(0.99)' },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	},
]);

export const image = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'cover',
});

export const imageContain = style({ objectFit: 'contain' });

export const loading = style({ opacity: 0 });

export const fallback = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: vars.palette.contrast_25,
	color: vars.palette.contrast_400,
});
