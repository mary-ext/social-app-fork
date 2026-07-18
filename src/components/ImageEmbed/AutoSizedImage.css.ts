import { createVar, style } from '@vanilla-extract/css';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

export const ratioVar = createVar();

const base = style([
	mediaBorder,
	{
		appearance: 'none',
		display: 'block',
		position: 'relative',
		transitionDuration: '200ms',
		transitionProperty: 'transform',
		margin: 0,
		borderRadius: borderRadius.md,
		backgroundColor: vars.palette.contrast_25,
		padding: 0,
		overflow: 'hidden',
		cursor: 'pointer',
		selectors: {
			'&:active': { transform: 'scale(0.99)' },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	},
]);

export const constrained = style([
	base,
	{ aspectRatio: ratioVar, width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))` },
]);

export const uncapped = style([base, { aspectRatio: ratioVar, width: '100%' }]);

export const square = style([base, { aspectRatio: '1', width: '100%' }]);

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
