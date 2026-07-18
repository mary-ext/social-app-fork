import { createVar, style } from '@vanilla-extract/css';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

export const ratioVar = createVar();

export const outer = style({ width: '100%' });

export const playButton = style({
	appearance: 'none',
	display: 'flex',
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 2,
	margin: 0,
	outline: 0,
	border: 0,
	background: 'transparent',
	padding: 0,
	cursor: 'pointer',
});

export const box = style([
	mediaBorder,
	{
		position: 'relative',
		borderRadius: borderRadius.md,
		backgroundColor: '#000',
		aspectRatio: ratioVar,
		width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))`,
		overflow: 'hidden',
		selectors: {
			[`&:has(${playButton}:focus-visible)`]: {
				outline: `2px solid ${vars.palette.primary_500}`,
				outlineOffset: -2,
			},
		},
	},
]);

export const inset = style({
	position: 'absolute',
	top: -2,
	right: -2,
	bottom: -2,
	left: -2,
});

export const video = style({
	display: 'block',
	width: '100%',
	height: '100%',
});

const dimBase = style({
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	zIndex: 1,
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_0 },
	},
});

export const dimInner = style([dimBase, { opacity: 0.2 }]);
export const dimOuter = style([dimBase, { opacity: 0.3 }]);

const badge = style({
	display: 'flex',
	position: 'absolute',
	bottom: 6,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 2,
	borderRadius: 6,
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	paddingBlock: 3,
	paddingInline: 4,
});

export const gifBadge = style([badge, { left: 6 }]);

export const altBadge = style([
	badge,
	{
		appearance: 'none',
		right: 6,
		margin: 0,
		border: 0,
		cursor: 'pointer',
		selectors: {
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	},
]);

export const badgeText = style({
	color: '#fff',
});
