import { style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

export const root = style({
	overflow: 'visible',
	width: '100%',
});

export const scroll = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: ITEM_GAP,
	height: '100%',
	overscrollBehaviorX: 'contain',
	overflowX: 'scroll',
	overflowY: 'hidden',
	position: 'relative',
	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});

export const item = style([
	mediaBorder,
	{
		appearance: 'none',
		background: vars.palette.contrast_25,
		borderRadius: borderRadius.md,
		cursor: 'inherit',
		display: 'block',
		flex: '0 0 auto',
		margin: 0,
		overflow: 'hidden',
		padding: 0,
		position: 'relative',
		transitionDuration: '200ms',
		transitionProperty: 'transform',
		selectors: {
			'&:active': { transform: 'scale(0.99)' },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	},
]);

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

export const imageContain = style({ objectFit: 'contain' });

export const loading = style({ opacity: 0 });

export const fallback = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	color: vars.palette.contrast_400,
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
});
