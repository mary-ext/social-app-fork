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
		backgroundColor: vars.palette.contrast_25,
		borderRadius: borderRadius.md,
		cursor: 'pointer',
		display: 'block',
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

export const constrained = style([
	base,
	{ aspectRatio: ratioVar, width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))` },
]);

export const uncapped = style([base, { aspectRatio: ratioVar, width: '100%' }]);

export const square = style([base, { aspectRatio: '1', width: '100%' }]);

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
