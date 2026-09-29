import { style } from '@vanilla-extract/css';

import { navHost } from '#/components/ImageEmbed/carousel/PagingControls.css';
import * as strip from '#/components/ImageEmbed/carousel/strip.css';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, iconSize } from '#/styles/tokens.css';

export const root = style([navHost, strip.root]);

export const scroll = style([strip.scroll, { position: 'relative' }]);

export const item = style([
	mediaBorder,
	strip.tile,
	{
		appearance: 'none',
		display: 'block',
		position: 'relative',
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

export const imageIcon = style({
	width: iconSize._3xl,
	height: iconSize._3xl,
});
